import {
  environment,
  getPreferenceValues,
  Icon,
  Keyboard,
  LaunchType,
  MenuBarExtra,
  open,
  openExtensionPreferences,
  updateCommandMetadata,
} from "@raycast/api";
import { useEffect } from "react";
import type { JamaahEvent } from "./ics";
import { directionsTo, Links } from "./links";
import { BILAL_PEACH, prayerIcon } from "./prayer-style";
import { formatTime, groupByDay, isTimeToGo, LabelStyle, leaveLabel, leaveSummary, leaveTime } from "./schedule";
import { useJamaah } from "./use-jamaah";

const MENU_ITEMS = 5;
const timeToGoIcon = { source: Icon.Footprints, tintColor: BILAL_PEACH };

export default function Command() {
  const now = new Date();
  const { events, minutes, isLoading, error, refresh } = useJamaah(now);
  const { trayTitle = LabelStyle.Full } = getPreferenceValues<{ trayTitle?: LabelStyle }>();
  const next = events[0];
  const nextLeaveAt = next && leaveTime(next, minutes);
  const summary = next && nextLeaveAt && `${next.title} ${leaveSummary(next, nextLeaveAt)}`;

  useEffect(() => {
    if (environment.launchType === LaunchType.Background) updateCommandMetadata({ subtitle: summary ?? null });
  }, [summary]);

  return (
    <MenuBarExtra
      icon={trayIcon(next, nextLeaveAt, now)}
      title={trayText(next, nextLeaveAt, now, trayTitle)}
      isLoading={isLoading}
      tooltip={summary ?? "Next jama'ah"}
    >
      {error && (
        <MenuBarExtra.Item
          title="Couldn't load your calendar link"
          subtitle={error.message}
          icon={{ source: Icon.Warning, tintColor: BILAL_PEACH }}
          onAction={openExtensionPreferences}
        />
      )}

      {!error && !isLoading && !next && (
        <MenuBarExtra.Item
          title="No upcoming jama'ah"
          subtitle="Timetable not available yet"
          icon={Icon.Calendar}
          onAction={() => open(Links.calendar)}
        />
      )}

      {next && nextLeaveAt && (
        <MenuBarExtra.Section title="Next jama'ah">
          <MenuBarExtra.Item
            title={`${next.title}  ${formatTime(next.start)}`}
            subtitle={leaveLabel(nextLeaveAt, now)}
            icon={isTimeToGo(nextLeaveAt, now) ? timeToGoIcon : Icon.Footprints}
            tooltip={directionsTo(next) ? "Take me there" : "Open Bilal Near"}
            shortcut={{ modifiers: ["cmd"], key: "d" }}
            onAction={() => openDirections(next)}
            alternate={
              <MenuBarExtra.Item
                title={`Leave by ${formatTime(nextLeaveAt)}`}
                icon={Icon.Clock}
                onAction={() => open(Links.near)}
              />
            }
          />
        </MenuBarExtra.Section>
      )}

      {groupByDay(events.slice(1, MENU_ITEMS + 1), now).map(([day, dayEvents]) => (
        <MenuBarExtra.Section key={day} title={day}>
          {dayEvents.map((event) => (
            <MenuBarExtra.Item
              key={event.start.toISOString() + event.title}
              title={event.title}
              subtitle={leaveSummary(event, leaveTime(event, minutes))}
              icon={prayerIcon(event.prayer)}
              onAction={() => openDirections(event)}
            />
          ))}
        </MenuBarExtra.Section>
      ))}

      <MenuBarExtra.Section>
        <MenuBarExtra.Item title="Open Bilal Near" icon={Icon.Geopin} onAction={() => open(Links.near)} />
        <MenuBarExtra.Item title="Open Bilal Display" icon={Icon.Monitor} onAction={() => open(Links.display)} />
        <MenuBarExtra.Item
          title="Refresh Timetable"
          icon={Icon.ArrowClockwise}
          shortcut={Keyboard.Shortcut.Common.Refresh}
          onAction={refresh}
        />
        <MenuBarExtra.Item title="Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}

function trayIcon(next: JamaahEvent | undefined, leaveAt: Date | undefined, now: Date) {
  if (!next || !leaveAt) return Icon.Clock;
  if (isTimeToGo(leaveAt, now)) return timeToGoIcon;
  return prayerIcon(next.prayer);
}

function trayText(next: JamaahEvent | undefined, leaveAt: Date | undefined, now: Date, style: LabelStyle) {
  if (!next || !leaveAt) return undefined;

  const label = leaveLabel(leaveAt, now, style);
  return style === LabelStyle.Compact ? label : `${next.title} · ${label}`;
}

function openDirections(event: JamaahEvent) {
  return open(directionsTo(event) ?? Links.near);
}
