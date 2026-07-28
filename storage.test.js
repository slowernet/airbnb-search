import { describe, it, expect } from "vitest";
import { loadForm, saveForm, DEFAULTS, STORAGE_KEY } from "./storage.js";

// Minimal stand-in for localStorage so these run without a browser.
const fakeStore = (initial = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
    _raw: () => map.get(STORAGE_KEY),
  };
};
const stored = (obj) => fakeStore({ [STORAGE_KEY]: JSON.stringify(obj) });

describe("loadForm", () => {
  it("returns defaults when nothing is stored", () => {
    expect(loadForm(fakeStore())).toEqual(DEFAULTS);
  });
  it("restores stored values", () => {
    const got = loadForm(stored({ location: "Paris", adults: 3, superhost: true }));
    expect(got.location).toBe("Paris");
    expect(got.adults).toBe(3);
    expect(got.superhost).toBe(true);
  });
  it("fills absent fields from defaults", () => {
    expect(loadForm(stored({ location: "Paris" })).roomTypes).toEqual([]);
  });

  // localStorage is user-editable and older builds leave older shapes behind. A
  // roomTypes that isn't an array would crash the first render on .includes.
  it("rejects a stored value whose type doesn't match its default", () => {
    const got = loadForm(stored({ roomTypes: "Entire home", adults: "lots", superhost: "yes" }));
    expect(got.roomTypes).toEqual([]);
    expect(got.adults).toBe(1);
    expect(got.superhost).toBe(false);
  });
  it("rejects null and undefined values", () => {
    expect(loadForm(stored({ location: null, adults: undefined })).location).toBe("");
    expect(loadForm(stored({ adults: null })).adults).toBe(1);
  });
  it("survives unparseable JSON", () => {
    expect(loadForm(fakeStore({ [STORAGE_KEY]: "{not json" }))).toEqual(DEFAULTS);
  });
  it("survives a stored array or primitive where an object was expected", () => {
    expect(loadForm(stored([1, 2, 3]))).toEqual(DEFAULTS);
    expect(loadForm(stored("nope"))).toEqual(DEFAULTS);
  });
  it("survives storage being unavailable entirely", () => {
    const throwing = { getItem: () => { throw new Error("SecurityError"); } };
    expect(loadForm(throwing)).toEqual(DEFAULTS);
    expect(loadForm(null)).toEqual(DEFAULTS);
  });
  it("ignores unknown keys rather than passing them through", () => {
    expect(loadForm(stored({ location: "Paris", evil: "x" }))).not.toHaveProperty("evil");
  });
});

describe("saveForm", () => {
  it("round-trips through loadForm", () => {
    const store = fakeStore();
    const state = { ...DEFAULTS, location: "Paris", adults: 2, selectedAmenities: [181, 510] };
    saveForm(state, store);
    expect(loadForm(store)).toEqual(state);
  });
  it("writes only known keys", () => {
    const store = fakeStore();
    saveForm({ ...DEFAULTS, secret: "leak" }, store);
    expect(JSON.parse(store._raw())).not.toHaveProperty("secret");
  });
  it("reports failure instead of throwing when storage rejects the write", () => {
    const full = { setItem: () => { throw new Error("QuotaExceededError"); } };
    expect(saveForm(DEFAULTS, full)).toBe(false);
  });
  it("reports failure when there is no storage at all", () => {
    expect(saveForm(DEFAULTS, null)).toBe(false);
  });
});

// Resetting the form writes DEFAULTS rather than deleting the key; the two must be
// indistinguishable on the next load, which is what makes clearForm unnecessary.
describe("resetting", () => {
  it("stored defaults load the same as no entry at all", () => {
    const store = fakeStore();
    saveForm({ ...DEFAULTS, location: "Paris" }, store);
    saveForm(DEFAULTS, store);
    expect(loadForm(store)).toEqual(loadForm(fakeStore()));
  });
});
