/**
 * Bulgarian → Latin, the official 2009 transliteration (the one on road signs
 * and in passports). Partial: a character not in the table is kept as it is.
 */
const latin: Partial<Record<string, string>> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s",
  т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht",
  ъ: "a", ь: "y", ю: "yu", я: "ya",
};

/** "Стара Загора" → "stara-zagora". Matches the server's slug rule exactly. */
export function slugify(text: string): string {
  return [...text.toLowerCase()]
    .map((char) => latin[char] ?? char)
    .join("")
    // Split accented Latin letters into letter + accent (NFD), then drop the
    // accents: \p{M} is Unicode's "mark" category, the accents themselves.
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The address Georgi would have typed by hand: the date, then the city. */
export function suggestSlug(startsAtLocal: string, cityBg: string): string {
  const date = startsAtLocal.slice(0, "2026-12-05".length);
  return [date, slugify(cityBg)].filter((part) => part !== "").join("-");
}
