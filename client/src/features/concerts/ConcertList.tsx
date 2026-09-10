import { Link } from "react-router";
import type { Lang } from "../../api/types";
import { formatWhen } from "./formatWhen";
import { useConcerts } from "./useConcerts";

export function ConcertList({ lang }: { lang: Lang }) {
  const state = useConcerts(lang);

  switch (state.status) {
    case "loading":
      return <p>{lang === "en" ? "Loading…" : "Зарежда се…"}</p>;

    case "error":
      // role="alert" makes screen readers announce this without being asked.
      return (
        <p role="alert">
          {lang === "en" ? "Could not load concerts." : "Концертите не се заредиха."}
        </p>
      );

    case "ready":
      if (state.concerts.length === 0) {
        return <p>{lang === "en" ? "No dates announced yet." : "Още няма обявени дати."}</p>;
      }

      return (
        <ul>
          {state.concerts.map((concert) => (
            <li key={concert.slug}>
              <Link to={`/koncerti/${concert.slug}`}>
                <time dateTime={concert.startsAt}>{formatWhen(concert.startsAt, lang)}</time>
                {" — "}
                <strong>{concert.venue}</strong>, {concert.city}
              </Link>
              {concert.note && <> · {concert.note}</>}
            </li>
          ))}
        </ul>
      );
  }
}