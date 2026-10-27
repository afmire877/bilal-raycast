import { describe, expect, it } from "vitest";
import { formatCountdown, groupByDay, LabelStyle, leaveLabel, leaveSummary, leaveTime, upcoming } from "./schedule";

const at = (iso: string) => new Date(iso);
const jamaah = (title: string, iso: string) => ({ title, start: at(iso) });

describe("upcoming", () => {
  it("should return future jama'ah earliest first", () => {
    const events = [jamaah("Isha", "2026-10-26T19:15:00Z"), jamaah("Asr", "2026-10-26T14:45:00Z")];

    const result = upcoming(events, at("2026-10-26T12:00:00Z"));

    expect(result.map((e) => e.title)).toEqual(["Asr", "Isha"]);
  });

  it("should drop jama'ah that has already started", () => {
    const events = [jamaah("Dhuhr", "2026-10-26T12:30:00Z"), jamaah("Asr", "2026-10-26T14:45:00Z")];

    const result = upcoming(events, at("2026-10-26T13:00:00Z"));

    expect(result.map((e) => e.title)).toEqual(["Asr"]);
  });
});

describe("formatCountdown", () => {
  it("should show minutes under an hour", () => {
    expect(formatCountdown(23 * 60_000)).toBe("23 min");
  });

  it("should show hours and minutes over an hour", () => {
    expect(formatCountdown(125 * 60_000)).toBe("2 hr 5 min");
  });

  it("should show now when under a minute", () => {
    expect(formatCountdown(30_000)).toBe("now");
  });

  it("should show now once time has passed", () => {
    expect(formatCountdown(-60_000)).toBe("now");
  });
});

describe("leaveLabel", () => {
  const leaveAt = at("2026-10-26T14:30:00Z");

  it("should count down to the leave-by time", () => {
    expect(leaveLabel(leaveAt, at("2026-10-26T14:00:00Z"))).toBe("Leave in 30 min");
  });

  it("should say time to go in the final minute before leaving", () => {
    expect(leaveLabel(leaveAt, at("2026-10-26T14:29:30Z"))).toBe("Time to go");
  });

  it("should still say time to go when compact", () => {
    expect(leaveLabel(leaveAt, at("2026-10-26T14:29:30Z"), LabelStyle.Compact)).toBe("Time to go");
  });

  it("should drop the wording when compact", () => {
    expect(leaveLabel(leaveAt, at("2026-10-26T14:00:00Z"), LabelStyle.Compact)).toBe("30 min");
  });
});

describe("groupByDay", () => {
  it("should label days relative to the given time", () => {
    const now = new Date(2026, 9, 26, 12, 0);
    const events = [
      { title: "Asr", start: new Date(2026, 9, 26, 14, 45) },
      { title: "Fajr", start: new Date(2026, 9, 27, 5, 30) },
      { title: "Dhuhr", start: new Date(2026, 9, 28, 12, 30) },
    ];

    const days = groupByDay(events, now).map(([day]) => day);

    expect(days).toEqual(["Today", "Tomorrow", "Wednesday 28 Oct"]);
  });
});

describe("leaveTime", () => {
  it("should be the jama'ah start minus the time away", () => {
    expect(leaveTime(jamaah("Asr", "2026-10-26T14:45:00Z"), 15)).toEqual(at("2026-10-26T14:30:00Z"));
  });
});

describe("leaveSummary", () => {
  it("should show the jama'ah time and when to leave", () => {
    const asr = { title: "Asr", start: new Date(2026, 9, 26, 14, 45) };

    expect(leaveSummary(asr, new Date(2026, 9, 26, 14, 30))).toBe("14:45 · leave 14:30");
  });
});
