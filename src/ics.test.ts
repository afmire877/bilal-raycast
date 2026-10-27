import { afterEach, describe, expect, it, vi } from "vitest";
import { parseEvents } from "./ics";
import { Prayer } from "./prayer";

const feed = (...events: string[]) => ["BEGIN:VCALENDAR", "VERSION:2.0", ...events, "END:VCALENDAR"].join("\r\n");

const event = (...lines: string[]) => ["BEGIN:VEVENT", ...lines, "END:VEVENT"].join("\r\n");

describe("parseEvents", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should read title and UTC start of an event", () => {
    const events = parseEvents(feed(event("SUMMARY:Asr jama'ah", "DTSTART:20261026T144500Z")));

    expect(events).toEqual([{ title: "Asr jama'ah", start: new Date("2026-10-26T14:45:00Z"), prayer: Prayer.Asr }]);
  });

  it("should recognise which prayer the event is for", () => {
    const [asr] = parseEvents(feed(event("SUMMARY:Asr jama'ah", "DTSTART:20261026T144500Z")));

    expect(asr.prayer).toBe(Prayer.Asr);
  });

  it("should convert a London local time in summer to UTC", () => {
    const [asr] = parseEvents(feed(event("SUMMARY:Asr", "DTSTART;TZID=Europe/London:20260715T180000")));

    expect(asr.start).toEqual(new Date("2026-07-15T17:00:00Z"));
  });

  it("should convert a London local time in winter to UTC", () => {
    const [isha] = parseEvents(feed(event("SUMMARY:Isha", "DTSTART;TZID=Europe/London:20261215T191500")));

    expect(isha.start).toEqual(new Date("2026-12-15T19:15:00Z"));
  });

  it("should skip all-day events", () => {
    const events = parseEvents(feed(event("SUMMARY:Eid", "DTSTART;VALUE=DATE:20261026")));

    expect(events).toEqual([]);
  });

  it("should read a time without zone as local time", () => {
    vi.stubEnv("TZ", "America/New_York");

    const [fajr] = parseEvents(feed(event("SUMMARY:Fajr", "DTSTART:20261026T052500")));

    expect(fajr.start).toEqual(new Date("2026-10-26T09:25:00Z"));
  });

  it("should read the mosque location with escaped characters", () => {
    const [asr] = parseEvents(
      feed(event("SUMMARY:Asr", "DTSTART:20261026T144500Z", "LOCATION:36 Aberfeldy St\\, E14 0NU")),
    );

    expect(asr.location).toBe("36 Aberfeldy St, E14 0NU");
  });

  it("should join folded lines", () => {
    const [asr] = parseEvents(feed(event("SUMMARY:Asr jama'ah at Aberfel", " dy Masjid", "DTSTART:20261026T144500Z")));

    expect(asr.title).toBe("Asr jama'ah at Aberfeldy Masjid");
  });

  it("should read the event link", () => {
    const [dhuhr] = parseEvents(
      feed(event("SUMMARY:Dhuhr", "DTSTART:20261027T123000Z", "URL:https://bilalathan.co.uk/calendar?m=mosque-000168")),
    );

    expect(dhuhr.url).toBe("https://bilalathan.co.uk/calendar?m=mosque-000168");
  });

  it("should read the mosque coordinates", () => {
    const [dhuhr] = parseEvents(feed(event("SUMMARY:Dhuhr", "DTSTART:20261027T123000Z", "GEO:51.535936;0.07722")));

    expect(dhuhr.geo).toEqual({ lat: 51.535936, lon: 0.07722 });
  });

  it("should read a quoted time zone", () => {
    const [asr] = parseEvents(feed(event("SUMMARY:Asr", 'DTSTART;TZID="Europe/London":20260715T180000')));

    expect(asr.start).toEqual(new Date("2026-07-15T17:00:00Z"));
  });

  it("should skip an event with an unknown time zone and keep the others", () => {
    const events = parseEvents(
      feed(
        event("SUMMARY:Asr", "DTSTART;TZID=Not/AZone:20261026T144500"),
        event("SUMMARY:Maghrib", "DTSTART:20261026T164500Z"),
      ),
    );

    expect(events.map((e) => e.title)).toEqual(["Maghrib"]);
  });

  it("should read a time zone parameter written in lower case", () => {
    const [asr] = parseEvents(feed(event("SUMMARY:Asr", "DTSTART;tzid=America/New_York:20260715T180000")));

    expect(asr.start).toEqual(new Date("2026-07-15T22:00:00Z"));
  });

  it("should read a value after a quoted parameter containing a colon", () => {
    const [asr] = parseEvents(
      feed(event("SUMMARY:Asr", "DTSTART:20261026T144500Z", 'LOCATION;ALTREP="http://x/map":36 Aberfeldy St')),
    );

    expect(asr.location).toBe("36 Aberfeldy St");
  });

  it("should ignore a line without a colon", () => {
    const [asr] = parseEvents(feed(event("SUMMARY", "SUMMARY:Asr", "DTSTART:20261026T144500Z")));

    expect(asr.title).toBe("Asr");
  });

  it("should drop cancelled events", () => {
    const events = parseEvents(
      feed(
        event("SUMMARY:Asr", "DTSTART:20261026T144500Z", "STATUS:CANCELLED"),
        event("SUMMARY:Maghrib", "DTSTART:20261026T164500Z", "STATUS:CONFIRMED"),
      ),
    );

    expect(events.map((e) => e.title)).toEqual(["Maghrib"]);
  });

  it("should not take the title from a reminder inside the event", () => {
    const [asr] = parseEvents(
      feed(
        event(
          "DTSTART:20261026T144500Z",
          "BEGIN:VALARM",
          "SUMMARY:Reminder",
          "TRIGGER:-PT10M",
          "END:VALARM",
          "SUMMARY:Asr",
        ),
      ),
    );

    expect(asr.title).toBe("Asr");
  });

  it("should read a repeated London hour at the clocks going back as its first occurrence", () => {
    const [fajr] = parseEvents(feed(event("SUMMARY:Fajr", "DTSTART;TZID=Europe/London:20261025T013000")));

    expect(fajr.start).toEqual(new Date("2026-10-25T00:30:00Z"));
  });

  it("should read a skipped London hour at the clocks going forward using the offset before the change", () => {
    const [fajr] = parseEvents(feed(event("SUMMARY:Fajr", "DTSTART;TZID=Europe/London:20260329T013000")));

    expect(fajr.start).toEqual(new Date("2026-03-29T01:30:00Z"));
  });
});
