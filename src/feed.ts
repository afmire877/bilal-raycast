import { Cache, getPreferenceValues } from "@raycast/api";
import { toFeedUrl } from "./feed-url";
import { type JamaahEvent, parseEvents } from "./ics";

const CACHE_KEY = "feed";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_LEAVE_MINUTES = 15;
const CALENDAR_MARKER = "BEGIN:VCALENDAR";
const FETCH_TIMEOUT_MS = 10_000;

export enum Freshness {
  Cached,
  Fresh,
}

type FeedPreferences = { calendarUrl: string; leaveMinutes?: string };
type CachedFeed = { url: string; fetchedAt: number; ics: string };

const cache = new Cache();

export function leaveMinutes(): number {
  const value = Number(getPreferenceValues<FeedPreferences>().leaveMinutes);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_LEAVE_MINUTES;
}

export async function loadEvents(freshness = Freshness.Cached): Promise<JamaahEvent[]> {
  const url = toFeedUrl(getPreferenceValues<FeedPreferences>().calendarUrl);
  const cached = readCache();
  const saved = cached?.url === url ? cached : undefined;

  if (freshness === Freshness.Cached && saved && isFresh(saved)) {
    const events = parseEvents(saved.ics);
    if (events.some((e) => e.start > new Date())) return events;
  }

  try {
    const ics = await fetchCalendar(url);
    cache.set(CACHE_KEY, JSON.stringify({ url, fetchedAt: Date.now(), ics } satisfies CachedFeed));
    return parseEvents(ics);
  } catch (error) {
    if (saved) return parseEvents(saved.ics);
    throw error;
  }
}

async function fetchCalendar(url: string): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Calendar link returned ${response.status}`);

  const ics = await response.text();
  if (!ics.includes(CALENDAR_MARKER)) throw new Error("That link isn't a calendar");
  return ics;
}

function isFresh(cached: CachedFeed): boolean {
  return Date.now() - cached.fetchedAt < CACHE_TTL_MS;
}

function readCache(): CachedFeed | undefined {
  const raw = cache.get(CACHE_KEY);
  if (!raw) return undefined;

  try {
    return JSON.parse(raw) as CachedFeed;
  } catch {
    return undefined;
  }
}
