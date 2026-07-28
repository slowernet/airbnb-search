import { describe, it, expect } from "vitest";
import {
  buildSearchUrl, validateSearch, parseCodes, normalizeLocation, clampInt,
  todayISO, addDays, nightsBetween,
} from "./searchUrl.js";

// Pinned so these assertions don't start failing once the real clock passes them.
const TODAY = "2026-07-28";

const url = (form) => buildSearchUrl({ location: "X", ...form });
const params = (form) => new URL(url(form)).search.slice(1).split("&").filter(Boolean);

describe("normalizeLocation", () => {
  it("keeps Airbnb's own slug format untouched", () => {
    expect(normalizeLocation("Catskills--New-York")).toBe("Catskills--New-York");
  });
  it("collapses whitespace to dashes", () => {
    expect(normalizeLocation("  New   York  ")).toBe("New-York");
  });
  it("recovers the slug from a pasted search URL", () => {
    expect(normalizeLocation("https://www.airbnb.com/s/Paris/homes?adults=2")).toBe("Paris");
  });
  it("decodes percent-escapes in a pasted slug", () => {
    expect(normalizeLocation("https://www.airbnb.com/s/Z%C3%BCrich/homes")).toBe("Zürich");
  });
  it("survives a malformed percent-escape instead of throwing", () => {
    expect(normalizeLocation("https://www.airbnb.com/s/%E0%A4%A/homes")).toBe("%E0%A4%A");
  });
  it("returns empty for blank input", () => {
    expect(normalizeLocation("   ")).toBe("");
    expect(normalizeLocation(null)).toBe("");
  });
});

describe("buildSearchUrl", () => {
  it("returns null until a location is entered", () => {
    expect(buildSearchUrl({ location: "" })).toBe(null);
    expect(buildSearchUrl({ location: "  ", adults: 2 })).toBe(null);
  });

  it("emits no query string when nothing else is set", () => {
    expect(buildSearchUrl({ location: "Paris" })).toBe("https://www.airbnb.com/s/Paris/homes");
  });

  it("leaves pre-encoded param fragments alone", () => {
    expect(params({ roomTypes: ["Entire%20home%2Fapt"], propertyTypes: ["1"], categoryTags: [8175] }))
      .toEqual(["room_types%5B%5D=Entire%20home%2Fapt", "l2_property_type_ids%5B%5D=1", "kg_and_tags%5B%5D=Tag%3A8175"]);
  });

  it("encodes only the location segment", () => {
    expect(url({ location: "Zürich" })).toBe("https://www.airbnb.com/s/Z%C3%BCrich/homes");
  });

  // Bug: min_* were held as strings and tested for truthiness, so "0" was truthy.
  it("omits zero-valued room and price params", () => {
    expect(params({ minBedrooms: "0", minBeds: "0", minBathrooms: "0", priceMin: "0", priceMax: "0" })).toEqual([]);
  });

  // Bug: HTML min/max attributes don't constrain typed or pasted values.
  it("drops negative values", () => {
    expect(params({ minBedrooms: "-3", priceMin: "-100", adults: -5 })).toEqual([]);
  });

  it("clamps guest counts and room counts to their maximums", () => {
    expect(params({ adults: 999, infants: 99, minBedrooms: "500" }))
      .toEqual(["adults=16", "infants=5", "min_bedrooms=16"]);
  });

  it("rejects non-integer numeric input rather than truncating it", () => {
    expect(params({ minBedrooms: "2.7", priceMin: "1e3", priceMax: "12abc" })).toEqual([]);
  });

  it("has no upper bound on price", () => {
    expect(params({ priceMax: "250000" })).toEqual(["price_max=250000"]);
  });

  it("ignores malformed dates and preserves valid ones", () => {
    expect(params({ checkin: "08/10/2026", checkout: "2026-08-12" })).toEqual(["checkout=2026-08-12"]);
  });

  it("ignores dates that are well-formed but impossible", () => {
    expect(params({ checkin: "2026-02-30", checkout: "2026-13-01" })).toEqual([]);
  });

  it("emits amenity codes in the order given", () => {
    expect(params({ amenityCodes: [4, 1, 47] }))
      .toEqual(["amenities%5B%5D=4", "amenities%5B%5D=1", "amenities%5B%5D=47"]);
  });

  it("emits superhost only when true", () => {
    expect(params({ superhost: false })).toEqual([]);
    expect(params({ superhost: true })).toEqual(["superhost=true"]);
  });

  it("tolerates missing array fields", () => {
    expect(() => buildSearchUrl({ location: "Paris" })).not.toThrow();
  });

  it("builds a full URL in Airbnb's param order", () => {
    expect(buildSearchUrl({
      location: "Catskills--New-York", checkin: "2026-08-01", checkout: "2026-08-05",
      adults: 2, pets: 1, roomTypes: ["Entire%20home%2Fapt"], minBedrooms: "2",
      propertyTypes: ["1"], amenityCodes: [7, 25], superhost: true,
      categoryTags: [8175], priceMin: "100", priceMax: "400",
    })).toBe(
      "https://www.airbnb.com/s/Catskills--New-York/homes" +
      "?checkin=2026-08-01&checkout=2026-08-05&adults=2&pets=1" +
      "&room_types%5B%5D=Entire%20home%2Fapt&min_bedrooms=2" +
      "&l2_property_type_ids%5B%5D=1&amenities%5B%5D=7&amenities%5B%5D=25" +
      "&superhost=true&kg_and_tags%5B%5D=Tag%3A8175&price_min=100&price_max=400"
    );
  });
});

describe("parseCodes", () => {
  it("accepts positive whole numbers", () => {
    expect(parseCodes("4, 25 47")).toEqual({ valid: [4, 25, 47], invalid: [] });
  });
  // Bug: parseInt accepted "12abc" as 12 and "1e3" as 1, silently applying wrong filters.
  it("reports malformed tokens instead of truncating them", () => {
    expect(parseCodes("12abc, 1e3, 0x1F")).toEqual({ valid: [], invalid: ["12abc", "1e3", "0x1F"] });
  });
  it("reports zero and negative tokens", () => {
    expect(parseCodes("0, -4, 3")).toEqual({ valid: [3], invalid: ["0", "-4"] });
  });
  // Bug: repeats inflated the "selected" counter while the URL emitted one code.
  it("dedupes repeats", () => {
    expect(parseCodes("4,4,4").valid).toEqual([4]);
  });
  it("handles blank and nullish input", () => {
    expect(parseCodes("   ")).toEqual({ valid: [], invalid: [] });
    expect(parseCodes(undefined)).toEqual({ valid: [], invalid: [] });
  });
});

describe("todayISO", () => {
  it("formats the local calendar date, not the UTC one", () => {
    // 23:30 local on the 28th. toISOString() would say the 29th east of UTC.
    expect(todayISO(new Date(2026, 6, 28, 23, 30))).toBe("2026-07-28");
    expect(todayISO(new Date(2026, 0, 5, 0, 15))).toBe("2026-01-05");
  });
});

describe("addDays", () => {
  it("rolls over months and years", () => {
    expect(addDays("2026-07-28", 1)).toBe("2026-07-29");
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("handles leap years", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
  it("crosses a DST boundary without shifting a day", () => {
    expect(addDays("2026-03-07", 1)).toBe("2026-03-08"); // US DST starts Mar 8 2026
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01"); // EU DST ends Oct 25 2026
  });
  it("returns null for an unusable date", () => {
    expect(addDays("", 1)).toBe(null);
    expect(addDays("2026-02-30", 1)).toBe(null);
  });
});

describe("nightsBetween", () => {
  it("counts nights", () => {
    expect(nightsBetween("2026-08-01", "2026-08-05")).toBe(4);
    expect(nightsBetween("2026-08-01", "2026-08-02")).toBe(1);
  });
  it("spans a DST transition without an off-by-one", () => {
    expect(nightsBetween("2026-03-07", "2026-03-09")).toBe(2);
  });
  it("returns null for a non-positive or incomplete range", () => {
    expect(nightsBetween("2026-08-05", "2026-08-01")).toBe(null);
    expect(nightsBetween("2026-08-05", "2026-08-05")).toBe(null);
    expect(nightsBetween("2026-08-05", "")).toBe(null);
  });
});

describe("validateSearch", () => {
  it("flags an inverted date range", () => {
    expect(validateSearch({ checkin: "2026-08-10", checkout: "2026-08-01" }, TODAY)).toHaveLength(1);
    expect(validateSearch({ checkin: "2026-08-10", checkout: "2026-08-10" }, TODAY)).toHaveLength(1);
    expect(validateSearch({ checkin: "2026-08-10", checkout: "2026-08-11" }, TODAY)).toEqual([]);
  });
  // The picker's `min` attribute constrains the widget, not a typed or pasted value.
  it("flags a past check-in", () => {
    expect(validateSearch({ checkin: "2020-01-01" }, TODAY)).toHaveLength(1);
    expect(validateSearch({ checkin: TODAY }, TODAY)).toEqual([]);
  });
  it("flags a past check-out when no check-in is set", () => {
    expect(validateSearch({ checkout: "2020-01-01" }, TODAY)).toHaveLength(1);
  });
  it("reports a past check-in once, not once per field", () => {
    expect(validateSearch({ checkin: "2020-01-01", checkout: "2020-01-05" }, TODAY)).toHaveLength(1);
  });
  it("flags an inverted price range", () => {
    expect(validateSearch({ priceMin: "900", priceMax: "100" }, TODAY)).toHaveLength(1);
    expect(validateSearch({ priceMin: "100", priceMax: "900" }, TODAY)).toEqual([]);
  });
  it("stays quiet when only one end of a range is set", () => {
    expect(validateSearch({ checkin: "2026-08-10", priceMin: "900" }, TODAY)).toEqual([]);
  });
  it("reports every problem at once", () => {
    expect(validateSearch({
      checkin: "2020-01-01", checkout: "2019-01-01", priceMin: "900", priceMax: "100",
    }, TODAY)).toHaveLength(3);
  });
  it("defaults to the real today when none is injected", () => {
    expect(validateSearch({ checkin: "2020-01-01" })).toHaveLength(1);
  });
});

describe("clampInt", () => {
  it("clamps to bounds and floors fractions", () => {
    expect(clampInt("99", 0, 16)).toBe(16);
    expect(clampInt("-4", 0, 16)).toBe(0);
    expect(clampInt("3.9", 0, 16)).toBe(3);
  });
  it("falls back to the minimum for a cleared field", () => {
    expect(clampInt("", 0, 16)).toBe(0);
    expect(clampInt("abc", 0, 16)).toBe(0);
  });
});
