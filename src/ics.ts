import { Prayer, prayerOf } from "./prayer";

export type JamaahEvent = {
  title: string;
  start: Date;
  location?: string;
  url?: string;
  geo?: { lat: number; lon: number };
  prayer?: Prayer;
};

const EVENT_BEGIN = "BEGIN:VEVENT";
const EVENT_END = "END:VEVENT";
const COMPONENT_BEGIN = "BEGIN:";
const COMPONENT_END = "END:";
const CANCELLED = "CANCELLED";
const BEFORE_VALUE = /^(?:[^":]|"[^"]*")*/;
const HALF_DAY_MS = 12 * 60 * 60 * 1000;
const DATE_TIME = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/;

type Property = { name: string; params: Record<string, string>; value: string };

export function parseEvents(ics: string): JamaahEvent[] {
  const events: JamaahEvent[] = [];
  let current: Property[] | undefined;
  let nestedDepth = 0;

  for (const line of unfold(ics)) {
    if (line === EVENT_BEGIN) {
      current = [];
      continue;
    }

    if (line === EVENT_END && current) {
      const event = toEvent(current);
      if (event) events.push(event);
      current = undefined;
      continue;
    }

    if (!current) continue;

    if (line.startsWith(COMPONENT_BEGIN)) {
      nestedDepth++;
      continue;
    }

    if (line.startsWith(COMPONENT_END) && nestedDepth > 0) {
      nestedDepth--;
      continue;
    }

    if (nestedDepth > 0) continue;

    const property = parseProperty(line);
    if (property) current.push(property);
  }

  return events;
}

function unfold(ics: string): string[] {
  return ics.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
}

function parseProperty(line: string): Property | undefined {
  const colon = BEFORE_VALUE.exec(line)![0].length;
  if (colon === line.length) return undefined;

  const [name, ...rawParams] = line.slice(0, colon).split(";");
  const params = Object.fromEntries(rawParams.map(parseParam));
  return { name: name.toUpperCase(), params, value: line.slice(colon + 1) };
}

function parseParam(raw: string): [string, string] {
  const equals = raw.indexOf("=");
  return [raw.slice(0, equals).toUpperCase(), unquote(raw.slice(equals + 1))];
}

function unquote(value: string): string {
  return value.replace(/^"(.*)"$/, "$1");
}

function toEvent(props: Property[]): JamaahEvent | undefined {
  const find = (name: string) => props.find((p) => p.name === name);
  if (find("STATUS")?.value.toUpperCase() === CANCELLED) return undefined;

  const dtstart = find("DTSTART");
  const start = dtstart && parseDateTime(dtstart);
  if (!start) return undefined;

  const location = find("LOCATION")?.value;
  const url = find("URL")?.value;
  const geo = parseGeo(find("GEO")?.value);
  const title = unescapeText(find("SUMMARY")?.value ?? "");
  const prayer = prayerOf(title);
  return {
    title,
    start,
    ...(location && { location: unescapeText(location) }),
    ...(url && { url }),
    ...(geo && { geo }),
    ...(prayer && { prayer }),
  };
}

function parseGeo(value: string | undefined): JamaahEvent["geo"] {
  const [lat, lon] = (value ?? "").split(";").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
  return { lat, lon };
}

function unescapeText(text: string): string {
  return text.replace(/\\([\\;,nN])/g, (_, c: string) => (c.toLowerCase() === "n" ? "\n" : c));
}

function parseDateTime(prop: Property): Date | undefined {
  const m = DATE_TIME.exec(prop.value);
  if (!m) return undefined;

  const [y, mo, d, h, mi, s] = m.slice(1, 7).map(Number);
  const wallClock = Date.UTC(y, mo - 1, d, h, mi, s);

  if (m[7]) return new Date(wallClock);

  const tz = prop.params.TZID;
  if (!isKnownZone(tz)) return undefined;
  return new Date(zonedToUtc(wallClock, tz));
}

function isKnownZone(timeZone: string | undefined): boolean {
  if (!timeZone) return true;

  try {
    zoneFormat(timeZone);
    return true;
  } catch {
    return false;
  }
}

function zonedToUtc(wallClock: number, timeZone: string): number {
  const before = tzOffset(wallClock - HALF_DAY_MS, timeZone);
  const after = tzOffset(wallClock + HALF_DAY_MS, timeZone);
  const valid = [before, after].find((offset) => tzOffset(wallClock - offset, timeZone) === offset);
  return wallClock - (valid ?? before);
}

function tzOffset(instant: number, timeZone: string): number {
  const parts = zoneFormat(timeZone).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

const zoneFormats = new Map<string, Intl.DateTimeFormat>();

function zoneFormat(timeZone: string): Intl.DateTimeFormat {
  const cached = zoneFormats.get(timeZone);
  if (cached) return cached;

  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  zoneFormats.set(timeZone, format);
  return format;
}
