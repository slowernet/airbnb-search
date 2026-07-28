# Recovering Airbnb category Tag IDs

How the `kg_and_tags[]=Tag:NNNN` values in `CATEGORY_TAGS` (`amenities.js`) were
obtained, so they can be re-verified when Airbnb changes them. Extracted 2026-07-28.

## Why this file exists

Airbnb retired the category filter strip from its UI in 2025, but the URL parameter
still works. The IDs are undocumented and can change without notice. Rediscovering
the *slugs* is the expensive part, so they are recorded here alongside each ID.

## Method

1. Fetch `https://www.airbnb.com/{region}/stays/{slug}` as HTML.
2. Extract `kg_and_tags%5B%5D=Tag%3A(\d+)` from the "Popular amenities" links.
3. If the page has no tag, harvest its `/{region}/stays/{slug}` links and try those.

Four things make this fail if you skip them:

- **Global `/stays/{slug}` pages usually don't carry the tag.** They render the value
  client-side, and it is absent even after scrolling the fully-hydrated page. Only
  regional pages have it in the HTML. `/united-states` is the highest-yield prefix.
- **Regional slugs are renamed.** `farms` → `farmstays`, `campers` → `rvs`,
  `tiny-homes` → `tiny-houses`, `earth-homes` → `earth-houses`, `containers` →
  `shipping-containers`, `camping` → `campsites`, `luxe` → `luxury`. Discover them by
  reading the global page's outbound links rather than guessing.
- **A harvested link must be checked for relatedness.** Following the first regional
  link blindly attributed `686` (Waterfront) to Shepherd's Huts. Require the target
  slug to share a token with the category before accepting its ID.
- **`airbnb.com/sitemaps/v2/categories-L0-0` 404s.** It is not a usable source.

## Results

26 IDs confirmed, each extracted directly from the page named in `CATEGORY_TAGS`.
This independently reproduced all 22 IDs from prior research with no discrepancies,
and added `8166`, `8228`, `8230`, `8232`.

### Needs confirmation

- **8650 — Shepherd's Huts**, via `/united-kingdom/stays/huts`. The slug is `huts`,
  not `shepherds-huts`, so this may be a broader "huts" category. Prior research
  claimed Shepherd's Huts routes through `property_type_id=66` with no tag at all.
  Unresolved; excluded from `CATEGORY_TAGS` until confirmed.
- **686 — Waterfront**, observed incidentally via the misattribution above. Never
  looked for deliberately and not verified.

### Not category tags

These landing pages exist but carry no `kg_and_tags` link. Prior research found the
first four route through `property_type_id` or `amenities[]` instead:

Amazing Pools (`amenities[]=7`, Private Pool), Cabins (`property_type_id[]=4`),
Chalets (`property_type_id[]=22`), Mansions (entire-home + `min_beds=4`), Vineyards,
Design, OMG!, National Parks, Countryside, Arctic.

Note `property_type_id` is a **different parameter with a different ID space** from
the `l2_property_type_ids` this app emits, where `4` means Hotel rather than Cabins.
Do not mix them.

### No landing page found

Every candidate 404'd, so no ID could be recovered: Amazing Views, Beach, Bed &
Breakfasts, Lakefront, Historical Homes, Golfing, Surfing, Skiing, Desert, Kezhans,
Dammusos, Tropical, Off-the-grid, Shared Homes, Iconic Cities, Chef's Kitchens, Grand
Pianos, Creative Spaces, Lake, Hanok, Icons, Top of the World, Trending.

Some of these may have no numeric ID by nature — location-style categories (Beach,
Desert, Countryside, National Parks) plausibly map to place tags rather than stable
numerics. Absence here is not proof an ID doesn't exist.

## Verified behaviour of the parameter

Measured by fetching `/s/United-States/homes` and tallying the `"title"` fields in
the response, which are readable server-side without running the page's JS.

**Tags filter; they do not merely re-rank.** Probed with categories whose name is
also the structure type, so card titles are diagnostic:

| Tag | Titles matching the category |
|-----|------------------------------|
| 8188 Treehouses | 16/18 |
| 8192 Yurts | 14/17 |
| 8176 Houseboats | 14/19 |
| 8047 Castles | 11/16 |
| 8043 Windmills | 0 listings returned |

Windmills is the proof: a **valid** id returning zero US listings means the parameter
constrains the result set. Re-ranking would still return a full page in a new order.

The 11–30% that don't match are probably not filtering failures. A castle listed as
"Villa in X" can sit legitimately in the Castles category, because the title names the
structure, not the category. This is why **Farms is useless as a probe** — a farm stay
is normally titled by the building on it (cabin, yurt, cottage), so a mixed result set
neither confirms nor refutes the mapping. An earlier conclusion that `8175` looked
wrong was drawn from exactly this mistake and was itself wrong.

**An unrecognized id is silently ignored.** `Tag:99999999` returned results identical
to no tag — not an error, not an empty set. So a wrong id is indistinguishable from no
filter, which is why nothing unverified ships. Note the contrast with a valid id that
matches nothing (Windmills), which returns *zero* results. Empty means the filter
worked; unfiltered means the id was rejected.

## Property-type parameters

Two distinct parameters with **different id spaces**. Never mix them.

`l2_property_type_ids[]` — what this app emits, and it still works: value `4` returned
17/17 hotel-type listings. Value `999999` returned the unfiltered baseline, so it
shares the silent-ignore behaviour.

`property_type_id[]` — a separate, finer taxonomy, recovered in full and stored as
`PROPERTY_TYPE_IDS`. Adopting it would let the Property type section offer Cabin,
Chalet, Castle, Windmill and 40 more that `l2_property_type_ids` cannot express. That
is a feature addition, not a bug fix — the existing pills work.

### How the sweep worked

This parameter is **self-labeling**: a valid id returns listings whose titles *are*
the property type (`4` → 20/20 "Cabin in …"). So ids 1–100 were swept against
`/s/United-States/homes` and labelled by their dominant title. Three outcomes:

| Signature | Meaning |
|-----------|---------|
| One title dominates (purity ≈ 1.0) | valid id, and the title names it |
| `Cabin` at purity ≈ 0.42 over 19 listings | the unfiltered baseline — id silently ignored |
| Zero listings | valid id with nothing matching in that region |

That middle signature is the whole reason the sweep is trustworthy: an invalid id
returns the same generic page every time, so it is trivially distinguishable from a
real one. 46 valid ids were found, all ≤ 69; every id from 70–100 returned baseline.

Ids with low purity or few listings are flagged `weak` in the table and should be
re-checked in a region where that type is common before being relied on. Three labels
are ambiguous — `Apartment` (1 and 47), `Room` (3, 42, 51) and `Tent` (16 and 34) —
where distinct ids share a display title.

### Corrections to prior research

- **Shepherd's Huts is not 66.** In the UK, where they are common, `66` returns a
  single listing while `24` returns 19/19 "Hut". Prefer 24.
- **Lakefront's `property_type_id=2` is just "Home"** (19/19). The prior note that
  Lakefront needs `2` *plus* lake-access amenity `133` is consistent with that — the
  id contributes no lakeside meaning on its own.
- Cabins `4` and Chalets `22` are confirmed twice over, by page extraction and by
  live search.
