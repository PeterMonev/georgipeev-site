import { Link, useParams } from "react-router";
import type { Lang } from "../../api/types";
import { formatWhen } from "./formatWhen";
import { useConcert } from "./useConcert";

export function ConcertPage({ lang }: { lang: Lang }) {
  // useParams reads the placeholders from the route pattern. Even though the
  // route is "/koncerti/:slug" and slug cannot really be missing, the type is
  // string | undefined: the hook has no idea which route rendered this
  // component, so it cannot promise the parameter exists.
  const { slug } = useParams<{ slug: string }>();

  const state = useConcert(slug, lang);

  switch (state.status) {
    case "loading":
      return <p>{lang === "en" ? "Loading…" : "Зарежда се…"}</p>;

    case "notFound":
      return (
        <section>
          <h2>{lang === "en" ? "No such concert" : "Няма такъв концерт"}</h2>
          <Link to="/">{lang === "en" ? "Back to all dates" : "Обратно към участията"}</Link>
        </section>
      );

    case "error":
      return (
        <p role="alert">
          {lang === "en" ? "Could not load this concert." : "Концертът не се зареди."}
        </p>
      );

    case "ready": {
      const { concert } = state;

      return (
        <article>
          <h2>{concert.venue}</h2>

          <p>
            <time dateTime={concert.startsAt}>{formatWhen(concert.startsAt, lang)}</time>
            {" · "}
            {concert.city}
            {concert.note && <> · {concert.note}</>}
          </p>

          <p>{concert.description}</p>

          {concert.ticketUrl && (
            <p>
              <a href={concert.ticketUrl} target="_blank" rel="noopener noreferrer">
                {lang === "en" ? "Tickets" : "Билети"}
              </a>
            </p>
          )}

          <Link to="/">{lang === "en" ? "Back to all dates" : "Обратно към участията"}</Link>
        </article>
      );
    }

    default: {
      // If a fifth status is added to the union and this switch does not handle
      // it, this assignment stops compiling. The forgotten case becomes a build
      // error instead of a blank screen.
      const unhandled: never = state;
      return unhandled;
    }
  }
}