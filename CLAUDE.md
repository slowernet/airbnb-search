# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev         # Vite dev server
npm run build       # production build to dist/
npm run preview     # serve the built bundle
npm test            # vitest, single run
npm run test:watch  # vitest in watch mode

npx vitest run -t "drops negative values"   # single test by name
```

No linter or formatter is configured.

## Architecture

A single-page React app that builds Airbnb search URLs. There is no backend, no
router, and no network I/O — the entire app is a pure function from form state to
a URL string.

- `main.jsx` — three-line entry point; mounts the default export of `index.jsx`.
- `searchUrl.js` — all URL construction and validation, as pure functions. No React.
- `searchUrl.test.js` — the only test file; covers `searchUrl.js` exhaustively.
- `amenities.js` — the static code tables.
- `index.jsx` — the `AirbnbUrlBuilder` component, small presentational helpers
  (`Section`, `Labeled`, `ChipRow`, `RejectedTokens`), and shared style objects.
- `index.html` — global CSS reset lives here in a `<style>` block. All other styling
  is inline `style={{}}` objects; there is no CSS file or styling library.

The component holds form state and renders; it does not decide what a valid param is.
Keep it that way — logic that lands in `index.jsx` is logic that can't be tested.

### URL generation

`buildSearchUrl` in `searchUrl.js` is the heart of the app, and the only logic with
real correctness stakes — it is deliberately React-free so `searchUrl.test.js` can
cover it directly. Put new param logic there, not in the component.

It returns `null` until a location is entered, which is what the fixed footer keys
off of to choose between the copy/open controls and the placeholder message.

Query params are assembled by pushing **already-percent-encoded literal strings**
into an array and joining with `&` — not via `URLSearchParams`. `[]` is written as
`%5B%5D`, `:` as `%3A`, and `ROOM_TYPES` values in the data table are stored
pre-encoded (`Entire%20home%2Fapt`). Only the location path segment goes through
`encodeURIComponent`. Preserve this convention when adding params: double-encoding
or switching to `URLSearchParams` will produce URLs Airbnb rejects.

Two rules the param helpers enforce, both of which were bugs before:

- **Only positive numbers reach the URL.** HTML `min`/`max` attributes do not
  constrain typed or pasted input, and a value held as a string makes `"0"` truthy.
  Guard with `positiveInt` or `positiveNumber`, never with a bare truthiness check.
  Counts you can't have half of (guests, bedrooms, beds) use `positiveInt`; bathrooms
  and prices use `positiveNumber`, because half-baths are ubiquitous on Airbnb and an
  integers-only guard silently dropped them. The exported `clampInt` is the matching
  guard at the input boundary, used by the guest steppers so the field shows the
  clamped value.
- **Malformed input is reported, not truncated.** `parseCodes` returns rejected
  tokens alongside valid ones because `parseInt` silently turns `"12abc"` into `12`.
  `RejectedTokens` renders them; don't drop input on the floor. The same applies to
  the free-text number fields: `NUMERIC_FIELDS` pairs each with the parser
  `buildSearchUrl` actually applies, so a warning can't drift from what reaches the
  URL. Add a field there when you add one to the form.

`validateSearch` handles cross-field problems (inverted date or price ranges) that
produce a syntactically valid but dead URL. These warn rather than block — the user
is explicitly in control of the URL being built.

`normalizeLocation` also recovers the slug from a pasted Airbnb search URL, since the
field's own hint tells users to mimic Airbnb's URL format. It parses with `new URL()`
rather than a regex: the host must match `AIRBNB_HOST` (a prefix check let
`airbnb.com.evil.example` through), and the segment after `/s/` must not be in
`RESERVED_SLUGS`, since `/s/<location>/homes` means a location-less search URL puts
the literal `homes` exactly where a location would go.

### Dates

`todayISO` builds the date from local `getFullYear`/`getMonth`/`getDate`, never
`toISOString()` — the latter reports tomorrow for a user in UTC+13 and yesterday for
one in UTC-8, which would put the wrong floor on the pickers. It's called per render
rather than memoized so a tab left open overnight doesn't keep yesterday's floor.

`addDays` and `nightsBetween` do their arithmetic in UTC so a DST transition can't
shift a result by a day, even though the dates themselves are local calendar dates.
`addDays` returns `null` outside 4-digit years, where `toISOString()` switches to
expanded form (`+010000-01-01`) and slicing it yields a corrupt date.

`validateSearch` takes `today` as an injected parameter so it stays pure; tests pin
it to a constant rather than reading the clock. Date assertions that depend on the
real clock are time bombs — pass `TODAY` explicitly.

The check-in picker floors at today and check-out at check-in + 1 night. Moving
check-in past an existing check-out shifts check-out along and preserves the trip
length; moving it *earlier* leaves check-out alone, since that just extends the stay.

### Amenity selection

Chip selections and hand-entered custom codes are merged into one deduped
`amenityCodes` array in the component, which feeds both the URL and the
"N selected (M hidden)" counters. Derive counts from that array only; counting the
two sources separately double-counts overlaps and misreports hidden filters.

The category list is bucketed into a `Map` once per search rather than re-scanning
all 585 rows for every category — that scan ran on every keystroke.

A numeric search query is an exact code lookup, not a substring match: searching `4`
must mean Wifi, not every id containing a 4.

### Data tables

All of these live in `amenities.js`.

- `AMENITIES` — 585 `{ id, name, cat }` entries across 19 categories, grouped by
  `// Category` comments in source order. `CATEGORIES` is derived from it, so display
  order follows first appearance and each category block must stay contiguous. Keep
  new entries inside their block.
- `VISIBLE_IDS` — the small set of amenity IDs Airbnb actually exposes in its own UI.
  Everything else is a "hidden" filter, marked with a red dot and surfaced in the
  `(N hidden)` count. This distinction is the app's reason to exist.
- `PROPERTY_TYPES` values are `l2_property_type_ids`; `kg_and_tags[]=Tag:ID` are
  knowledge-graph category tags Airbnb removed from its UI in April 2025 but still
  honors. Only ID 8175 (Farms) is confirmed; the rest of the names are listed in the
  UI as un-mapped.

These IDs are reverse-engineered from Airbnb's URLs, not a published API. Do not
invent IDs — an unverified code silently returns zero results.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds and publishes
`dist/` to GitHub Pages. `vite.config.js` sets `base: "/airbnb-search/"` to match the
Pages subpath; changing the repo name requires updating it.
