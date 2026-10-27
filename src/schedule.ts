import type { JamaahEvent } from "./ics";

const MINUTE_MS = 60_000;
const MINUTES_PER_HOUR = 60;
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short" });

export function upcoming(events: JamaahEvent[], now: Date): JamaahEvent[] {
  return events.filter((e) => e.start > now).sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function formatCountdown(ms: number): string {
  const totalMinutes = Math.floor(ms / MINUTE_MS);
  if (totalMinutes < 1) return "now";

  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export enum LabelStyle {
  Full = "full",
  Compact = "compact",
}

export function leaveLabel(leaveAt: Date, now: Date, style = LabelStyle.Full): string {
  const compact = style === LabelStyle.Compact;
  if (isTimeToGo(leaveAt, now)) return compact ? "Go" : "Time to go";

  const countdown = formatCountdown(leaveAt.getTime() - now.getTime());
  return compact ? countdown : `Leave in ${countdown}`;
}

export function isTimeToGo(leaveAt: Date, now: Date): boolean {
  return leaveAt.getTime() - now.getTime() < MINUTE_MS;
}

export function leaveTime(event: JamaahEvent, leaveMinutes: number): Date {
  return new Date(event.start.getTime() - leaveMinutes * MINUTE_MS);
}

export function leaveSummary(event: JamaahEvent, leaveAt: Date): string {
  return `${formatTime(event.start)} · leave ${formatTime(leaveAt)}`;
}

export function formatTime(date: Date): string {
  return timeFormat.format(date);
}

export function groupByDay(events: JamaahEvent[], now: Date): [string, JamaahEvent[]][] {
  const groups = new Map<string, JamaahEvent[]>();
  for (const event of events) {
    const day = dayLabel(event.start, now);
    const group = groups.get(day);
    if (group) group.push(event);
    else groups.set(day, [event]);
  }
  return [...groups];
}

function dayLabel(date: Date, now: Date): string {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return dayFormat.format(date);
}
