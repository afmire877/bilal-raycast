import { Icon, Image } from "@raycast/api";
import { Prayer } from "./prayer";

type Tint = { light: string; dark: string };

export const BILAL_PEACH: Tint = { light: "#A9765A", dark: "#DBB49D" };

const STYLES: Record<Prayer, { icon: Icon; tint: Tint }> = {
  [Prayer.Fajr]: { icon: Icon.Sunrise, tint: { light: "#7E6A93", dark: "#B9A8CC" } },
  [Prayer.Dhuhr]: { icon: Icon.Sun, tint: { light: "#9C7A2E", dark: "#E3C78A" } },
  [Prayer.Jumuah]: { icon: Icon.Sun, tint: { light: "#5E7A62", dark: "#A9C2A6" } },
  [Prayer.Asr]: { icon: Icon.CloudSun, tint: { light: "#9A6B45", dark: "#D9A77E" } },
  [Prayer.Maghrib]: { icon: Icon.Moonrise, tint: { light: "#9C5848", dark: "#D18D7B" } },
  [Prayer.Isha]: { icon: Icon.Moon, tint: { light: "#56637F", dark: "#97A3BE" } },
};

export function prayerIcon(prayer: Prayer | undefined): Image.ImageLike {
  if (!prayer) return Icon.Clock;

  const { icon, tint } = STYLES[prayer];
  return { source: icon, tintColor: tint };
}
