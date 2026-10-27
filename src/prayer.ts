export enum Prayer {
  Fajr = "fajr",
  Dhuhr = "dhuhr",
  Jumuah = "jumuah",
  Asr = "asr",
  Maghrib = "maghrib",
  Isha = "isha",
}

export const PRAYERS: Record<Prayer, { name: string; spellings: string[] }> = {
  [Prayer.Fajr]: { name: "Fajr", spellings: ["fajr"] },
  [Prayer.Jumuah]: { name: "Jumu'ah", spellings: ["jumu'ah", "jumu’ah", "jumuah", "jummah", "jumah"] },
  [Prayer.Dhuhr]: { name: "Dhuhr", spellings: ["dhuhr", "zuhr", "duhr"] },
  [Prayer.Asr]: { name: "Asr", spellings: ["asr"] },
  [Prayer.Maghrib]: { name: "Maghrib", spellings: ["maghrib"] },
  [Prayer.Isha]: { name: "Isha", spellings: ["isha", "esha"] },
};

const PATTERNS = Object.entries(PRAYERS).map(
  ([prayer, { spellings }]) => [new RegExp(`\\b(${spellings.join("|")})\\b`, "i"), prayer as Prayer] as const,
);

export function prayerOf(title: string): Prayer | undefined {
  return PATTERNS.find(([pattern]) => pattern.test(title))?.[1];
}
