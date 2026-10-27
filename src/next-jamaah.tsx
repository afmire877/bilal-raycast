import {
  Action,
  ActionPanel,
  Color,
  Icon,
  Keyboard,
  launchCommand,
  LaunchType,
  List,
  openExtensionPreferences,
  showToast,
  Toast,
} from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useCallback, useEffect, useState } from "react";
import type { JamaahEvent } from "./ics";
import { directionsTo, Links } from "./links";
import { Prayer, PRAYERS } from "./prayer";
import { prayerIcon } from "./prayer-style";
import { formatCountdown, formatTime, groupByDay, isTimeToGo, leaveLabel, leaveTime } from "./schedule";
import { useJamaah } from "./use-jamaah";

const TICK_MS = 30_000;
const ALL_PRAYERS = "all";
const MENU_BAR_COMMAND = "menu-bar";

export default function Command() {
  const [now, setNow] = useState(() => new Date());
  const [prayer, setPrayer] = useState(ALL_PRAYERS);
  const [showingDetail, setShowingDetail] = useState(false);
  const { events, minutes, isLoading, error, refresh } = useJamaah(now);
  const toggleDetail = useCallback(() => setShowingDetail((s) => !s), []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const shown = prayer === ALL_PRAYERS ? events : events.filter((e) => e.prayer === prayer);
  const present = new Set(events.map((e) => e.prayer));
  const prayers = Object.values(Prayer).filter((p) => present.has(p));

  const refreshAll = async () => {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Refreshing timetable" });
    try {
      await refresh();
      await launchCommand({ name: MENU_BAR_COMMAND, type: LaunchType.Background }).catch(() => undefined);
      toast.style = Toast.Style.Success;
      toast.title = "Timetable updated";
    } catch (e) {
      await toast.hide();
      await showFailureToast(e, { title: "Couldn't refresh timetable" });
    }
  };

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.Calendar}
          title="Couldn't load your calendar link"
          description={`${error.message}. Get the link from ${Links.calendar}.`}
          actions={
            <ActionPanel>
              <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
              <Action.OpenInBrowser title="Get Calendar Link" icon={Icon.Calendar} url={Links.calendar} />
              <Action.CopyToClipboard title="Copy Error" icon={Icon.Clipboard} content={error.message} />
              <Action.OpenInBrowser title="Report a Problem" icon={Icon.Bug} url={Links.bug} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={showingDetail && shown.length > 0}
      searchBarPlaceholder="Filter jama'ah"
      searchBarAccessory={
        <List.Dropdown tooltip="Prayer" storeValue onChange={setPrayer}>
          <List.Dropdown.Item title="All Prayers" value={ALL_PRAYERS} />
          {prayers.map((p) => (
            <List.Dropdown.Item key={p} title={PRAYERS[p].name} value={p} icon={prayerIcon(p)} />
          ))}
        </List.Dropdown>
      }
    >
      <List.EmptyView
        icon={Icon.Calendar}
        title="No upcoming jama'ah"
        description="Timetable not available yet. Check with the mosque."
        actions={
          <ActionPanel>
            <Action title="Refresh Timetable" icon={Icon.ArrowClockwise} onAction={refreshAll} />
            <Action.OpenInBrowser title="Find a Mosque" icon={Icon.MagnifyingGlass} url={Links.mosques} />
          </ActionPanel>
        }
      />
      {groupByDay(shown, now).map(([day, dayEvents]) => (
        <List.Section key={day} title={day}>
          {dayEvents.map((event) => (
            <JamaahItem
              key={event.start.toISOString() + event.title}
              event={event}
              now={now}
              minutes={minutes}
              showingDetail={showingDetail}
              onToggleDetail={toggleDetail}
              onRefresh={refreshAll}
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}

type JamaahItemProps = {
  event: JamaahEvent;
  now: Date;
  minutes: number;
  showingDetail: boolean;
  onToggleDetail: () => void;
  onRefresh: () => Promise<void>;
};

function JamaahItem({ event, now, minutes, showingDetail, onToggleDetail, onRefresh }: JamaahItemProps) {
  const leaveAt = leaveTime(event, minutes);
  const directions = directionsTo(event);
  const leaveTag = {
    tag: { value: leaveLabel(leaveAt, now), color: isTimeToGo(leaveAt, now) ? Color.Orange : Color.SecondaryText },
  };
  const timing = [
    { text: `in ${formatCountdown(event.start.getTime() - now.getTime())}` },
    { text: { value: formatTime(event.start), color: Color.PrimaryText } },
  ];

  return (
    <List.Item
      icon={prayerIcon(event.prayer)}
      title={event.title}
      keywords={event.prayer && PRAYERS[event.prayer].spellings}
      accessories={showingDetail ? [leaveTag] : [leaveTag, ...timing]}
      detail={showingDetail ? <JamaahDetail event={event} leaveAt={leaveAt} minutes={minutes} /> : undefined}
      actions={
        <ActionPanel>
          {directions && <Action.OpenInBrowser title="Take Me There" icon={Icon.Map} url={directions} />}
          <Action
            title={showingDetail ? "Hide Details" : "Show Details"}
            icon={Icon.Sidebar}
            shortcut={{ modifiers: ["cmd"], key: "d" }}
            onAction={onToggleDetail}
          />
          <Action.OpenInBrowser title="Open Bilal Near" icon={Icon.Geopin} url={Links.near} />
          <Action.OpenInBrowser title="Open Bilal Display" icon={Icon.Monitor} url={Links.display} />
          {event.url && <Action.OpenInBrowser title="Open My Mosque on Bilal" icon={Icon.House} url={event.url} />}
          <Action.CopyToClipboard
            title="Copy Time"
            icon={Icon.Clipboard}
            content={`${event.title} ${formatTime(event.start)}`}
          />
          <Action
            title="Refresh Timetable"
            icon={Icon.ArrowClockwise}
            shortcut={Keyboard.Shortcut.Common.Refresh}
            onAction={onRefresh}
          />
          <ActionPanel.Section>
            <Action.CreateQuicklink
              title="Save Bilal Near as Quicklink"
              icon={Icon.Link}
              quicklink={{ name: "Bilal Near", link: Links.near }}
            />
            <Action.OpenInBrowser title="Find a Mosque" icon={Icon.MagnifyingGlass} url={Links.mosques} />
            <Action.OpenInBrowser title="Report a Problem" icon={Icon.Bug} url={Links.bug} />
            <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function JamaahDetail({ event, leaveAt, minutes }: { event: JamaahEvent; leaveAt: Date; minutes: number }) {
  const directions = directionsTo(event);

  return (
    <List.Item.Detail
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Jama'ah" text={formatTime(event.start)} />
          <List.Item.Detail.Metadata.Label title="Leave by" text={formatTime(leaveAt)} icon={Icon.Footprints} />
          <List.Item.Detail.Metadata.Label title="Time away" text={`${minutes} minutes`} />
          {event.location && (
            <>
              <List.Item.Detail.Metadata.Separator />
              <List.Item.Detail.Metadata.Label title="Mosque" text={event.location} />
            </>
          )}
          {directions && <List.Item.Detail.Metadata.Link title="Directions" text="Take me there" target={directions} />}
        </List.Item.Detail.Metadata>
      }
    />
  );
}
