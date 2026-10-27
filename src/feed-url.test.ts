import { describe, expect, it } from "vitest";
import { toFeedUrl } from "./feed-url";

describe("toFeedUrl", () => {
  it("should turn a webcal link into https", () => {
    expect(toFeedUrl("webcal://bilalathan.co.uk/cal/abc.ics")).toBe("https://bilalathan.co.uk/cal/abc.ics");
  });

  it("should accept uppercase and secure webcal links", () => {
    expect(["WEBCAL://a.co/x.ics", "webcals://a.co/x.ics"].map(toFeedUrl)).toEqual([
      "https://a.co/x.ics",
      "https://a.co/x.ics",
    ]);
  });

  it("should keep an https link", () => {
    expect(toFeedUrl(" https://bilalathan.co.uk/cal/abc.ics ")).toBe("https://bilalathan.co.uk/cal/abc.ics");
  });

  it("should reject other schemes", () => {
    expect(() => toFeedUrl("file:///etc/passwd")).toThrow();
  });

  it("should reject unencrypted http", () => {
    expect(() => toFeedUrl("http://bilalathan.co.uk/cal/abc.ics")).toThrow();
  });

  it("should reject text that is not a link", () => {
    expect(() => toFeedUrl("my mosque")).toThrow();
  });
});
