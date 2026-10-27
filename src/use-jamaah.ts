import { useCachedPromise } from "@raycast/utils";
import { Freshness, leaveMinutes, loadEvents } from "./feed";
import { upcoming } from "./schedule";

export function useJamaah(now: Date) {
  const { data, isLoading, error, mutate } = useCachedPromise(loadEvents, [Freshness.Cached], {
    keepPreviousData: true,
  });

  return {
    events: upcoming(data ?? [], now),
    minutes: leaveMinutes(),
    isLoading,
    error: data ? undefined : error,
    refresh: () => mutate(loadEvents(Freshness.Fresh)),
  };
}
