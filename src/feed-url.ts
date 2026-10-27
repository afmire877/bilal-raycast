const WEBCAL = /^webcals?:\/\//i;
const HTTPS = "https:";

export function toFeedUrl(input: string): string {
  const url = new URL(input.trim().replace(WEBCAL, "https://"));
  if (url.protocol !== HTTPS) throw new Error("Calendar link must start with webcal:// or https://");

  return url.toString();
}
