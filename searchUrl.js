// Airbnb search URLs are assembled from pre-encoded literal fragments rather than
// URLSearchParams: `[]` must arrive as %5B%5D, `:` as %3A, and ROOM_TYPES values ship
// pre-encoded from the data table. Running these through URLSearchParams (or
// encodeURIComponent) double-escapes them and Airbnb rejects the result. Only the
// location path segment is encoded here.

const SEARCH_BASE = "https://www.airbnb.com/s/";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const GUEST_LIMITS = { adults: 16, children: 16, infants: 5, pets: 5 };
export const ROOM_MAX = 16;

export const clampInt = (raw, min, max) => {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};

// Both return null for anything unusable so the caller can omit the param entirely.
// Deliberately stricter than parseInt, which accepts "12abc" as 12 and "1e3" as 1 —
// both silently wrong filters.
//
// Counts of things you can't have half of use positiveInt. Bathrooms and prices use
// positiveNumber: half-baths are ubiquitous on Airbnb and $99.99 is an ordinary way
// to type a price, and rejecting them silently drops a filter the user can still see
// in the field.
function positiveInt(value, max = Number.MAX_SAFE_INTEGER) {
  const s = String(value ?? "").trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n > 0 ? Math.min(n, max) : null;
}

function positiveNumber(value, max = Number.MAX_SAFE_INTEGER) {
  const s = String(value ?? "").trim();
  if (!/^\d+(?:\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 ? Math.min(n, max) : null;
}

// Rejects impossible calendar dates as well as malformed ones. `type="date"` can't
// produce 2026-02-30, but a pasted or hand-edited value can.
const isoDate = (value) => {
  const s = String(value ?? "");
  if (!ISO_DATE.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const real = dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  return real ? s : null;
};

// Local calendar date, not UTC: toISOString() would report tomorrow for a user in
// UTC+13 and yesterday for one in UTC-8, blocking or allowing the wrong days.
export function todayISO(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// UTC arithmetic so a DST transition can't shift the result by a day.
export function addDays(date, days) {
  const iso = isoDate(date);
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const result = new Date(Date.UTC(y, m - 1, d + days));
  // Outside 4-digit years toISOString() switches to expanded form (+010000-01-01),
  // and slicing that yields a corrupt date the date input silently discards.
  const year = result.getUTCFullYear();
  if (year < 0 || year > 9999) return null;
  return result.toISOString().slice(0, 10);
}

export function nightsBetween(checkin, checkout) {
  const from = isoDate(checkin);
  const to = isoDate(checkout);
  if (!from || !to) return null;
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  const nights = ms / 86400000;
  return nights > 0 ? nights : null;
}

// Anchored so a lookalike host can't pass: `airbnb\.[^/]+` would have matched
// airbnb.com.evil.example. Covers airbnb.com, airbnb.co.uk, airbnb.com.au.
const AIRBNB_HOST = /^(?:www\.)?airbnb\.(?:[a-z]{2,}\.)?[a-z]{2,}$/i;

// `/s/<location>/homes` is the format, so the segment after /s/ is only a location
// when it isn't one of the literals Airbnb puts there for a location-less search.
// Without this, pasting .../s/homes?adults=2 yields the "location" `homes`.
const RESERVED_SLUGS = new Set(["homes", "all", "experiences", "plus", "stays"]);

// The location hint tells users to mimic Airbnb's own URL format, so pasting a whole
// search URL is a predictable move. Recover the slug instead of encoding a URL into
// the middle of another URL.
export function normalizeLocation(raw) {
  let s = String(raw ?? "").trim();

  if (/^https?:\/\//i.test(s)) {
    let url = null;
    try {
      url = new URL(s);
    } catch {
      url = null; // unparseable; fall through and treat the input as literal text
    }
    const [root, slug = ""] = url ? url.pathname.split("/").filter(Boolean) : [];
    if (url && AIRBNB_HOST.test(url.hostname) && root === "s") {
      // An Airbnb search URL carrying no usable location resolves to empty, which
      // leaves the app showing its "enter a location" prompt rather than building a
      // URL around a junk slug.
      if (RESERVED_SLUGS.has(slug.toLowerCase())) {
        s = "";
      } else {
        // Scoped tightly: a malformed escape must cost us the decode, not the URL
        // parse we already succeeded at.
        try {
          s = decodeURIComponent(slug);
        } catch {
          s = slug;
        }
      }
    }
  }

  return s.trim().replace(/\s+/g, "-");
}

// Returns deduped codes plus the tokens that were rejected, so the UI can tell the
// user what it dropped rather than silently truncating.
export function parseCodes(raw) {
  const valid = new Set();
  const invalid = [];
  for (const token of String(raw ?? "").split(/[\s,]+/).filter(Boolean)) {
    const n = positiveInt(token);
    if (n === null) invalid.push(token);
    else valid.add(n);
  }
  return { valid: [...valid], invalid };
}

// The free-text number fields, paired with the parser buildSearchUrl applies to each
// so the warning can't drift from what actually reaches the URL. Guest counts are
// absent because clampInt already normalizes them at the input.
const NUMERIC_FIELDS = [
  ["minBedrooms", "Min bedrooms", positiveInt],
  ["minBeds", "Min beds", positiveInt],
  ["minBathrooms", "Min bathrooms", positiveNumber],
  ["priceMin", "Min price", positiveNumber],
  ["priceMax", "Max price", positiveNumber],
];

// Cross-field problems that produce a syntactically fine but dead URL. These warn
// rather than block: the user is explicitly in control of the URL being built.
// `today` is injected so this stays pure and testable; the caller passes the current
// local date. ISO dates compare correctly as strings.
export function validateSearch(form, today = todayISO()) {
  const warnings = [];

  const checkin = isoDate(form.checkin);
  const checkout = isoDate(form.checkout);

  // The pickers set `min`, but that constrains only the widget — a typed or pasted
  // value bypasses it entirely, same as with the numeric fields.
  if (checkin && checkin < today) {
    warnings.push("Check-in is in the past — Airbnb only returns results for future stays.");
  } else if (!checkin && checkout && checkout < today) {
    warnings.push("Check-out is in the past — Airbnb only returns results for future stays.");
  }

  if (checkin && checkout && checkout <= checkin) {
    warnings.push("Check-out is on or before check-in — a stay must be at least one night.");
  }

  const priceMin = positiveNumber(form.priceMin);
  const priceMax = positiveNumber(form.priceMax);
  if (priceMin && priceMax && priceMin > priceMax) {
    warnings.push("Min price is above max price — this search returns no listings.");
  }

  // A number field holding something unusable drops its param silently, and the
  // field goes on displaying the value. Say so, the way RejectedTokens does for
  // amenity codes. Zero is exempt: it means "no minimum" and omitting it is right.
  for (const [key, label, parse] of NUMERIC_FIELDS) {
    const raw = String(form[key] ?? "").trim();
    if (!raw || Number(raw) === 0) continue;
    if (parse(raw) === null) {
      warnings.push(`${label} isn't a positive ${parse === positiveInt ? "whole number" : "number"} — that filter was left out.`);
    }
  }

  return warnings;
}

export function buildSearchUrl(form) {
  const location = normalizeLocation(form.location);
  if (!location) return null;

  const params = [];
  const push = (key, value) => params.push(`${key}=${value}`);
  const pushIfPositive = (key, value, max, parse = positiveInt) => {
    const n = parse(value, max);
    if (n !== null) push(key, n);
  };

  const checkin = isoDate(form.checkin);
  const checkout = isoDate(form.checkout);
  if (checkin) push("checkin", checkin);
  if (checkout) push("checkout", checkout);

  for (const key of ["adults", "children", "infants", "pets"]) {
    pushIfPositive(key, form[key], GUEST_LIMITS[key]);
  }

  for (const roomType of form.roomTypes ?? []) push("room_types%5B%5D", roomType);

  pushIfPositive("min_bedrooms", form.minBedrooms, ROOM_MAX);
  pushIfPositive("min_beds", form.minBeds, ROOM_MAX);
  pushIfPositive("min_bathrooms", form.minBathrooms, ROOM_MAX, positiveNumber);

  for (const id of form.propertyTypes ?? []) push("l2_property_type_ids%5B%5D", id);
  for (const id of form.amenityCodes ?? []) push("amenities%5B%5D", id);

  if (form.superhost) push("superhost", "true");

  for (const id of form.categoryTags ?? []) push("kg_and_tags%5B%5D", `Tag%3A${id}`);

  pushIfPositive("price_min", form.priceMin, undefined, positiveNumber);
  pushIfPositive("price_max", form.priceMax, undefined, positiveNumber);

  const base = `${SEARCH_BASE}${encodeURIComponent(location)}/homes`;
  return params.length > 0 ? `${base}?${params.join("&")}` : base;
}
