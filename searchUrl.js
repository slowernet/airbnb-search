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

// Whole number > 0, clamped to max. Everything else is null so the caller can omit
// the param entirely. Deliberately stricter than parseInt, which accepts "12abc" as
// 12 and "1e3" as 1 — both silently wrong filters.
function positiveInt(value, max = Number.MAX_SAFE_INTEGER) {
  const s = String(value ?? "").trim();
  if (!/^\d+$/.test(s)) return null;
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
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function nightsBetween(checkin, checkout) {
  const from = isoDate(checkin);
  const to = isoDate(checkout);
  if (!from || !to) return null;
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  const nights = ms / 86400000;
  return nights > 0 ? nights : null;
}

// The location hint tells users to mimic Airbnb's own URL format, so pasting a whole
// search URL is a predictable move. Recover the slug instead of encoding a URL into
// the middle of another URL.
export function normalizeLocation(raw) {
  let s = String(raw ?? "").trim();
  const pasted = s.match(/^https?:\/\/(?:www\.)?airbnb\.[^/]+\/s\/([^/?#]+)/i);
  if (pasted) {
    try {
      s = decodeURIComponent(pasted[1]);
    } catch {
      s = pasted[1]; // malformed percent-escape; keep the raw slug
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

  const priceMin = positiveInt(form.priceMin);
  const priceMax = positiveInt(form.priceMax);
  if (priceMin && priceMax && priceMin > priceMax) {
    warnings.push("Min price is above max price — this search returns no listings.");
  }

  return warnings;
}

export function buildSearchUrl(form) {
  const location = normalizeLocation(form.location);
  if (!location) return null;

  const params = [];
  const push = (key, value) => params.push(`${key}=${value}`);
  const pushIfPositive = (key, value, max) => {
    const n = positiveInt(value, max);
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
  pushIfPositive("min_bathrooms", form.minBathrooms, ROOM_MAX);

  for (const id of form.propertyTypes ?? []) push("l2_property_type_ids%5B%5D", id);
  for (const id of form.amenityCodes ?? []) push("amenities%5B%5D", id);

  if (form.superhost) push("superhost", "true");

  for (const id of form.categoryTags ?? []) push("kg_and_tags%5B%5D", `Tag%3A${id}`);

  pushIfPositive("price_min", form.priceMin);
  pushIfPositive("price_max", form.priceMax);

  const base = `${SEARCH_BASE}${encodeURIComponent(location)}/homes`;
  return params.length > 0 ? `${base}?${params.join("&")}` : base;
}
