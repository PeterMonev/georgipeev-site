import { Link, useParams } from "react-router";
import type { Lang } from "../../api/types";
import styles from "./ConcertPage.module.css";
import { formatWhen } from "./formatWhen";
import { useConcert } from "./useConcert";

export function ConcertPage({ lang }: { lang: Lang }) {
  const en = lang === "en";

  // useParams reads the placeholders from the route pattern. Even though the
  // route is "/koncerti/:slug" and slug cannot really be missing, the type is
  // string | undefined: the hook has no idea which route rendered this
  // component, so it cannot promise the parameter exists.
  const { slug } = useParams<{ slug: string }>();

  const state = useConcert(slug, lang);

  const back = (
    <Link to="/" className={styles.back}>
      ← {en ? "All dates" : "Всички участия"}
    </Link>
  );

  switch (state.status) {
    case "loading":
      return <p>{en ? "Loading…" : "Зарежда се…"}</p>;

    case "notFound":
      return (
        <section>
          {back}
          <h2>{en ? "No such concert" : "Няма такъв концерт"}</h2>
        </section>
      );

    case "error":
      return (
        <p role="alert" className="alert">
          {en ? "Could not load this concert." : "Концертът не се зареди."}
        </p>
      );

    case "ready": {
      const { concert } = state;

      return (
        <article className={styles.article}>
          {back}

          <p className="kicker">
            <time dateTime={concert.startsAt}>{formatWhen(concert.startsAt, lang)}</time>
          </p>
          <h1 className={styles.title}>{concert.venue}</h1>

          <p className={styles.meta}>
            {concert.city}
            {concert.note && <> · {concert.note}</>}
          </p>

          {concert.description && <p className={styles.description}>{concert.description}</p>}

          {concert.ticketUrl && (
            <p className={styles.actions}>
              <a
                href={concert.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
              >
                {en ? "Tickets" : "Билети"}
              </a>
            </p>
          )}
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
