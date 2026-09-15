import { Link } from "react-router";
import type { Lang } from "../../api/types";
import { formatDate } from "../../lib/dates";
import styles from "./NewsList.module.css";
import { useNews } from "./useNews";

export function NewsList({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const state = useNews(lang);

  return (
    <section>
      <div className={styles.head}>
        <p className="kicker">{en ? "Latest" : "Последно"}</p>
        <h2>{en ? "News" : "Новини"}</h2>
      </div>

      {state.status === "loading" && <p>{en ? "Loading…" : "Зарежда се…"}</p>}

      {state.status === "error" && (
        <p role="alert" className="alert">
          {en ? "Could not load the news." : "Новините не се заредиха."}
        </p>
      )}

      {state.status === "ready" && state.stories.length === 0 && (
        <p className={styles.empty}>{en ? "No news yet." : "Още няма новини."}</p>
      )}

      {state.status === "ready" && state.stories.length > 0 && (
        <ul className={styles.list}>
          {state.stories.map((story) => (
            <li key={story.slug}>
              <Link to={`/news/${story.slug}`} className={styles.story}>
                <div>
                  <time dateTime={story.publishedAt} className={styles.date}>
                    {formatDate(story.publishedAt, lang)}
                  </time>
                  <h3>{story.title}</h3>
                  <p>{story.summary}</p>
                </div>
                <span className="btn">{en ? "Read" : "Прочети"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}