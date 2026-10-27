import { Icon, Image } from "@raycast/api";
import { Prayer } from "./prayer";

const STYLES: Record<Prayer, { icon: Icon; tint: { light: string; dark: string } }> = {
  [Prayer.Fajr]: { icon: Icon.Sunrise, tint: { light: "#9B6FB8", dark: "#C9A0DC" } },
  [Prayer.Dhuhr]: { icon: Icon.Sun, tint: { light: "#C98F00", dark: "#F5C242" } },
  [Prayer.Jumuah]: { icon: Icon.Sun, tint: { light: "#2E8B57", dark: "#4CC38A" } },
  [Prayer.Asr]: { icon: Icon.CloudSun, tint: { light: "#C9701F", dark: "#F0A35E" } },
  [Prayer.Maghrib]: { icon: Icon.Moonrise, tint: { light: "#C4452F", dark: "#F07A62" } },
  [Prayer.Isha]: { icon: Icon.Moon, tint: { light: "#4A5BC4", dark: "#8C9BF2" } },
};

export function prayerIcon(prayer: Prayer | undefined): Image.ImageLike {
  if (!prayer) return Icon.Clock;

  const { icon, tint } = STYLES[prayer];
  return { source: icon, tintColor: tint };
}
