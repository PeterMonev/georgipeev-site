import { Link } from "react-router";
import type { Lang } from "../../api/types";
import styles from "./ConcertList.module.css";
import { formatWhenParts } from "./formatWhen";
import { useConcerts } from "./useConcerts";

export function ConcertList({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const state = useConcerts(lang);

  return (
    <section>
      <div className={styles.head}>
        <p className="kicker">{en ? "Live" : "На живо"}</p>
        <h2>{en ? "Upcoming" : "Предстоящи участия"}</h2>
      </div>

      {state.status === "loading" && <p>{en ? "Loading…" : "Зарежда се…"}</p>}

      {state.status === "error" && (
        // role="alert" makes screen readers announce this without being asked.
        <p role="alert" className="alert">
          {en ? "Could not load concerts." : "Концертите не се заредиха."}
        </p>
      )}

      {state.status === "ready" && state.concerts.length === 0 && (
        <p className={styles.empty}>
          {en ? "No dates announced yet." : "Още няма обявени дати."}
        </p>
      )}

      {state.status === "ready" && state.concerts.length > 0 && (
        <ul className={styles.list}>
          {state.concerts.map((concert) => {
            const when = formatWhenParts(concert.startsAt, lang);

            return (
              <li key={concert.slug}>
                <Link to={`/koncerti/${concert.slug}`} className={styles.gig}>
                  <time dateTime={concert.startsAt} className={styles.when}>
                    <span className={styles.day}>{when.day}</span>
                    <span className={styles.month}>
                      {when.month} · {when.time}
                    </span>
                  </time>

                  <div className={styles.where}>
                    <h3>{concert.venue}</h3>
                    <p>
                      {concert.city}
                      {concert.note && <> · {concert.note}</>}
                    </p>
                  </div>

                  <span className="btn">{en ? "Details" : "Повече"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
