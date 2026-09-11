import type { Lang } from "../../api/types";

const zone = "Europe/Sofia";

const locale = (lang: Lang) => (lang === "en" ? "en-GB" : "bg-BG");

/**
 * The server stores an instant; the browser decides how it reads. Sofia time,
 * in the visitor's language, computed by the platform rather than by us.
 */
export function formatWhen(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: zone,
  }).format(new Date(iso));
}

/** The pieces a concert row lays out separately: "12", "окт", "20:00". */
export function formatWhenParts(iso: string, lang: Lang): { day: string; month: string; time: string } {
  const date = new Date(iso);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale(lang), { ...options, timeZone: zone }).format(date);

  return {
    day: part({ day: "numeric" }),
    // Bulgarian has no short month names in Intl (it gives "10"), so the
    // long name is cut to three letters in both languages: окт, Oct.
    month: part({ month: "long" }).slice(0, 3),
    time: part({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
  };
}
