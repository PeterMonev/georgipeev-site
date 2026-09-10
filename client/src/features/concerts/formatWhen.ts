import type { Lang } from "../../api/types";

/**
 * The server stores an instant; the browser decides how it reads. Sofia time,
 * in the visitor's language, computed by the platform rather than by us.
 */
export function formatWhen(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Sofia",
  }).format(new Date(iso));
}