import { describe, expect, it } from "vitest";
import { directionsTo } from "./links";

const start = new Date("2026-10-27T12:30:00Z");

describe("directionsTo", () => {
  it("should route to the mosque coordinates when known", () => {
    const event = { title: "Dhuhr", start, location: "1 High St", geo: { lat: 51.5, lon: 0.07 } };

    expect(directionsTo(event)).toBe("https://www.google.com/maps/dir/?api=1&destination=51.5%2C0.07");
  });

  it("should fall back to the mosque address", () => {
    expect(directionsTo({ title: "Asr", start, location: "1 High St" })).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=1%20High%20St",
    );
  });

  it("should have no directions without a location", () => {
    expect(directionsTo({ title: "Asr", start })).toBeUndefined();
  });
});
