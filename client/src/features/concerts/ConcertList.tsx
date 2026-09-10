import type { Lang } from "../../api/types";
import { useConcerts } from "./useConcerts";

/**
 * The server stores an instant; the browser decides how it reads. Sofia time,
 * in the visitor's language, computed by the platform rather than by us.
 */
function formatWhen(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Sofia",
  }).format(new Date(iso));
}

export function ConcertList({ lang }: { lang: Lang }) {
  const { concerts, isLoading, error } = useConcerts(lang);

  if (isLoading) {
    return <p>{lang === "en" ? "Loading…" : "Зарежда се…"}</p>;
  }

  if (error) {
    // role="alert" makes screen readers announce this without being asked.
    return <p role="alert">{lang === "en" ? "Could not load concerts." : "Концертите не се заредиха."}</p>;
  }

  if (concerts === null || concerts.length === 0) {
    return <p>{lang === "en" ? "No dates announced yet." : "Още няма обявени дати."}</p>;
  }

  return (
    <ul>
      {concerts.map((concert) => (
        <li key={concert.slug}>
          <time dateTime={concert.startsAt}>{formatWhen(concert.startsAt, lang)}</time>
          {" — "}
          <strong>{concert.venue}</strong>, {concert.city}
          {concert.note && <> · {concert.note}</>}
        </li>
      ))}
    </ul>
  );
}