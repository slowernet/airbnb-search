// Form persistence. Kept separate from the component so the load path — the only part
// with real failure modes — is testable without a browser.
//
// The key is versioned: changing the shape of DEFAULTS should mean bumping it rather
// than trying to migrate whatever an old build left behind.
export const STORAGE_KEY = "airbnb-search:form:v1";

// Every persisted field and its default. Single source of truth for three things:
// initial state, what gets written, and what "Clear form" resets to — so those can't
// drift apart. Transient UI (amenity search text, which categories are expanded,
// the copied flag) is deliberately absent; restoring it would be noise.
export const DEFAULTS = {
  location: "",
  checkin: "",
  checkout: "",
  adults: 1,
  children: 0,
  infants: 0,
  pets: 0,
  roomTypes: [],
  l2PropertyTypes: [],
  propertyTypeIds: [],
  priceMin: "",
  priceMax: "",
  minBedrooms: "",
  minBeds: "",
  minBathrooms: "",
  superhost: false,
  selectedAmenities: [], // held as a Set in the component; an array on disk
  customCodes: "",
  categoryTags: "",
};

// localStorage is user-editable and may hold a shape from an older build, so a stored
// value is only accepted when it matches its default's type. Without this, a
// `roomTypes` that isn't an array crashes the first render on `.includes`.
const sameShape = (value, fallback) =>
  Array.isArray(fallback)
    ? Array.isArray(value)
    : value !== null && value !== undefined && typeof value === typeof fallback;

const storageOr = (given) => given ?? globalThis.localStorage ?? null;

export function loadForm(storage) {
  const store = storageOr(storage);
  let saved = null;
  try {
    const raw = store?.getItem(STORAGE_KEY);
    saved = raw ? JSON.parse(raw) : null;
  } catch {
    saved = null; // unavailable (private mode, disabled) or unparseable — use defaults
  }
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return { ...DEFAULTS };

  const out = {};
  for (const [key, fallback] of Object.entries(DEFAULTS)) {
    out[key] = sameShape(saved[key], fallback) ? saved[key] : fallback;
  }
  return out;
}

// Writes only known keys, so a stray field on the passed object can't reach disk.
export function saveForm(state, storage) {
  const store = storageOr(storage);
  if (!store) return false;
  const payload = {};
  for (const key of Object.keys(DEFAULTS)) payload[key] = state[key];
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false; // quota exceeded or storage disabled; persistence is best-effort
  }
}

// There is deliberately no clearForm(). Resetting writes DEFAULTS through the normal
// save path, and a stored DEFAULTS loads identically to no entry at all — so removing
// the key would be immediately undone by the next save and only look like it worked.
