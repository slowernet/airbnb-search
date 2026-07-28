import { describe, it, expect } from "vitest";
import {
  buildSearchUrl, validateSearch, parseCodes, normalizeLocation, clampInt,
  todayISO, addDays, addMonths, nightsBetween, staySummary,
  applyStayPreset, matchingStayPreset, STAY_PRESETS,
} from "./searchUrl.js";

const preset = (label) => STAY_PRESETS.find((p) => p.label === label);

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
  it("accepts Airbnb's country domains", () => {
    expect(normalizeLocation("https://www.airbnb.co.uk/s/London/homes")).toBe("London");
    expect(normalizeLocation("http://airbnb.com.au/s/Sydney/homes")).toBe("Sydney");
  });
  // `/s/<location>/homes` is the format, so a location-less search URL puts a literal
  // there. Reading it as a place name produced .../s/homes/homes.
  it("does not mistake a reserved path segment for a location", () => {
    expect(normalizeLocation("https://www.airbnb.com/s/homes?adults=2")).toBe("");
    expect(normalizeLocation("https://www.airbnb.com/s/all?adults=2")).toBe("");
    expect(normalizeLocation("https://www.airbnb.com/s/")).toBe("");
  });
  it("rejects lookalike hosts rather than trusting the prefix", () => {
    const evil = "https://www.airbnb.com.evil.example/s/Paris/homes";
    expect(normalizeLocation(evil)).not.toBe("Paris");
    expect(normalizeLocation("https://www.notairbnb.com/s/Paris/homes")).not.toBe("Paris");
  });
  it("leaves non-Airbnb URLs and plain text as literal input", () => {
    expect(normalizeLocation("Isla de Ometepe")).toBe("Isla-de-Ometepe");
    expect(normalizeLocation("http://[not a url")).toBe("http://[not-a-url");
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
    expect(params({ roomTypes: ["Entire%20home%2Fapt"], l2PropertyTypes: ["1"], categoryTags: [8175] }))
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

  it("rejects non-integer input for counts you can't have half of", () => {
    expect(params({ minBedrooms: "2.7", minBeds: "1.5", adults: 2.5 })).toEqual([]);
  });

  // Regression: an earlier integers-only guard silently dropped these, and half-baths
  // are ubiquitous on Airbnb.
  it("keeps fractional bathrooms and prices", () => {
    expect(params({ minBathrooms: "2.5" })).toEqual(["min_bathrooms=2.5"]);
    expect(params({ priceMin: "99.99", priceMax: "250.50" }))
      .toEqual(["price_min=99.99", "price_max=250.5"]);
  });

  it("still rejects malformed numerics in the fractional fields", () => {
    expect(params({ minBathrooms: "2.5.1", priceMin: "1e3", priceMax: "12abc" })).toEqual([]);
    expect(params({ minBathrooms: "-2.5" })).toEqual([]);
  });

  it("clamps a fractional bathroom count to the room maximum", () => {
    expect(params({ minBathrooms: "99.5" })).toEqual(["min_bathrooms=16"]);
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

  // Two taxonomies, overlapping ids, different meanings: 4 is Hotel in one and Cabin
  // in the other. A value must never leak between them.
  it("keeps the two property-type parameters separate", () => {
    expect(params({ l2PropertyTypes: ["4"] })).toEqual(["l2_property_type_ids%5B%5D=4"]);
    expect(params({ propertyTypeIds: [4] })).toEqual(["property_type_id%5B%5D=4"]);
    expect(params({ l2PropertyTypes: ["4"], propertyTypeIds: [22] }))
      .toEqual(["l2_property_type_ids%5B%5D=4", "property_type_id%5B%5D=22"]);
  });

  it("emits every selected property type id", () => {
    expect(params({ propertyTypeIds: [4, 22, 69] }))
      .toEqual(["property_type_id%5B%5D=4", "property_type_id%5B%5D=22", "property_type_id%5B%5D=69"]);
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
      l2PropertyTypes: ["1"], amenityCodes: [7, 25], superhost: true,
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
  // Past year 9999 toISOString() switches to +010000-01-01 and slicing corrupts it.
  it("returns null rather than a corrupt string outside 4-digit years", () => {
    expect(addDays("9999-12-31", 1)).toBe(null);
    expect(addDays("9999-12-30", 1)).toBe("9999-12-31");
  });
});

describe("addMonths", () => {
  it("lands on the same day of the next month", () => {
    expect(addMonths("2026-08-01", 1)).toBe("2026-09-01");
    expect(addMonths("2026-08-15", 3)).toBe("2026-11-15");
  });
  it("rolls over the year", () => {
    expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
    expect(addMonths("2026-12-31", 1)).toBe("2027-01-31");
  });
  // Naive Date.UTC(y, m+1, 31) rolls Jan 31 forward to Mar 3.
  it("clamps to the last day when the target month is shorter", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-03-31", 1)).toBe("2026-04-30");
    expect(addMonths("2026-08-31", 6)).toBe("2027-02-28");
  });
  it("clamps to Feb 29 in a leap year", () => {
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
  });
  it("returns null for an unusable date", () => {
    expect(addMonths("", 1)).toBe(null);
    expect(addMonths("2026-02-30", 1)).toBe(null);
  });
  it("returns null rather than a corrupt string outside 4-digit years", () => {
    expect(addMonths("9999-12-01", 1)).toBe(null);
  });
});

describe("stay presets", () => {
  it("applies weeks as exact night counts", () => {
    expect(applyStayPreset("2026-08-01", preset("1 week"))).toBe("2026-08-08");
    expect(applyStayPreset("2026-08-01", preset("2 weeks"))).toBe("2026-08-15");
  });
  it("applies months as calendar months", () => {
    expect(applyStayPreset("2026-08-01", preset("1 month"))).toBe("2026-09-01");
    expect(applyStayPreset("2026-01-31", preset("1 month"))).toBe("2026-02-28");
    expect(applyStayPreset("2026-08-01", preset("3 months"))).toBe("2026-11-01");
  });
  it("gives a month different night counts depending on the month", () => {
    expect(nightsBetween("2026-08-01", applyStayPreset("2026-08-01", preset("1 month")))).toBe(31);
    expect(nightsBetween("2026-02-01", applyStayPreset("2026-02-01", preset("1 month")))).toBe(28);
  });
  // Matters because Airbnb's monthly pricing and installment billing start at 28
  // nights (airbnb.com/help/article/1233, /2584). The shortest calendar month is
  // exactly 28, so month presets always reach it — including the clamped Jan 31 ->
  // Feb 28 case, which lands on the boundary rather than under it.
  it("never produces a month shorter than 28 nights", () => {
    const starts = ["2026-01-31", "2026-02-01", "2026-08-01", "2028-01-31"];
    for (const p of STAY_PRESETS.filter((x) => x.months)) {
      for (const start of starts) {
        expect(nightsBetween(start, applyStayPreset(start, p))).toBeGreaterThanOrEqual(28);
      }
    }
  });
  it("returns null for an unusable check-in", () => {
    expect(applyStayPreset("", preset("1 month"))).toBe(null);
    expect(applyStayPreset("2026-08-01", null)).toBe(null);
  });

  it("recognises a range that matches a preset", () => {
    expect(matchingStayPreset("2026-08-01", "2026-09-01")).toBe(preset("1 month"));
    expect(matchingStayPreset("2026-08-01", "2026-08-08")).toBe(preset("1 week"));
    // Clamped month-ends still round-trip.
    expect(matchingStayPreset("2026-01-31", "2026-02-28")).toBe(preset("1 month"));
  });
  it("returns null for a range that matches nothing", () => {
    expect(matchingStayPreset("2026-08-01", "2026-08-20")).toBe(null);
    expect(matchingStayPreset("2026-08-01", "")).toBe(null);
    expect(matchingStayPreset("", "2026-09-01")).toBe(null);
  });
  // 28 nights from Feb 1 is exactly Mar 1, which is also "1 month" from Feb 1.
  // The first match wins, and weeks are listed first, so check it stays unambiguous.
  it("does not report a 4-week range as a month", () => {
    expect(matchingStayPreset("2026-02-01", "2026-03-01")).toBe(preset("1 month"));
  });
});

describe("staySummary", () => {
  // A preset's night count varies with the calendar, so printing one of the four
  // possible numbers reads as canonical when it isn't.
  it("names the preset instead of a night count", () => {
    expect(staySummary("2026-08-01", "2026-09-01")).toBe("1 month · monthly stay");
    expect(staySummary("2026-02-01", "2026-03-01")).toBe("1 month · monthly stay");
    expect(staySummary("2026-08-01", "2026-11-01")).toBe("3 months · monthly stay");
  });
  it("falls back to a night count for a hand-picked range", () => {
    expect(staySummary("2026-08-01", "2026-08-20")).toBe("19 nights");
    expect(staySummary("2026-08-01", "2026-08-02")).toBe("1 night");
  });
  // The designation follows stay length, not whether a preset was used.
  it("flags a hand-picked range that reaches the threshold", () => {
    expect(staySummary("2026-08-01", "2026-08-29")).toBe("28 nights · monthly stay");
    expect(staySummary("2026-08-01", "2026-08-28")).toBe("27 nights");
  });
  it("says nothing without a usable range", () => {
    expect(staySummary("2026-08-01", "")).toBe(null);
    expect(staySummary("2026-08-05", "2026-08-01")).toBe(null);
  });
  it("weeks stay under the threshold and are labelled plainly", () => {
    expect(staySummary("2026-08-01", "2026-08-08")).toBe("1 week");
    expect(staySummary("2026-08-01", "2026-08-15")).toBe("2 weeks");
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

  // A number field that drops its param goes on displaying the value, so silence
  // reads as "applied".
  it("reports a number field whose value never reaches the URL", () => {
    expect(validateSearch({ minBedrooms: "1e3" }, TODAY)).toEqual([
      "Min bedrooms isn't a positive whole number — that filter was left out.",
    ]);
    expect(validateSearch({ minBathrooms: "2.5.1" }, TODAY)).toEqual([
      "Min bathrooms isn't a positive number — that filter was left out.",
    ]);
    expect(validateSearch({ minBeds: "-3" }, TODAY)).toHaveLength(1);
  });
  it("stays quiet for values that legitimately reach the URL", () => {
    expect(validateSearch({ minBedrooms: "2", minBathrooms: "2.5", priceMin: "99.99" }, TODAY)).toEqual([]);
  });
  it("treats zero as 'no minimum' rather than an error", () => {
    expect(validateSearch({ minBedrooms: "0", priceMin: "0" }, TODAY)).toEqual([]);
  });
  it("does not warn about an empty field", () => {
    expect(validateSearch({ minBedrooms: "", minBathrooms: "  " }, TODAY)).toEqual([]);
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
