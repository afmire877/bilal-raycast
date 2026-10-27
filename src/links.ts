import type { JamaahEvent } from "./ics";

const SITE = "https://bilalathan.co.uk";

export const Links = {
  near: `${SITE}/near`,
  display: `${SITE}/display/`,
  calendar: `${SITE}/calendar`,
  mosques: `${SITE}/mosques/`,
  help: `${SITE}/help.html`,
  bug: `${SITE}/bug.html`,
};

export function directionsTo(event: JamaahEvent): string | undefined {
  const destination = event.geo ? `${event.geo.lat},${event.geo.lon}` : event.location;
  if (!destination) return undefined;

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
