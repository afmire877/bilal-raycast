import { describe, expect, it } from "vitest";
import { Prayer, prayerOf } from "./prayer";

describe("prayerOf", () => {
  it("should recognise the prayer named in an event title", () => {
    expect(prayerOf("Asr jama'ah at Aberfeldy Masjid")).toBe(Prayer.Asr);
  });

  it("should recognise Jumu'ah ahead of the Dhuhr it replaces", () => {
    expect(prayerOf("Jumu'ah jama'ah")).toBe(Prayer.Jumuah);
  });

  it("should recognise alternative spellings", () => {
    expect(["Zuhr", "Jummah", "Esha"].map(prayerOf)).toEqual([Prayer.Dhuhr, Prayer.Jumuah, Prayer.Isha]);
  });

  it("should recognise Jumu'ah written with a curly apostrophe", () => {
    expect(prayerOf("Jumu’ah")).toBe(Prayer.Jumuah);
  });

  it("should leave unrecognised titles without a prayer", () => {
    expect(prayerOf("Eid salah")).toBeUndefined();
  });
});
