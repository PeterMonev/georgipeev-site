import { Link, useParams } from "react-router";
import type { Lang } from "../../api/types";
import { formatDate } from "../../lib/dates";
import styles from "../../styles/article.module.css";
import { useStory } from "./useStory";

export function StoryPage({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const { slug } = useParams<{ slug: string }>();
  const state = useStory(slug, lang);

  const back = (
    <Link to="/news" className={styles.back}>
      ← {en ? "All news" : "Всички новини"}
    </Link>
  );

  switch (state.status) {
    case "loading":
      return <p>{en ? "Loading…" : "Зарежда се…"}</p>;

    case "notFound":
      return (
        <section>
          {back}
          <h2>{en ? "No such story" : "Няма такава новина"}</h2>
        </section>
      );

    case "error":
      return (
        <p role="alert" className="alert">
          {en ? "Could not load this story." : "Новината не се зареди."}
        </p>
      );

    case "ready": {
      const { story } = state;

      return (
        <article className={styles.article}>
          {back}

          <p className="kicker">
            <time dateTime={story.publishedAt}>{formatDate(story.publishedAt, lang)}</time>
          </p>
          <h1 className={styles.title}>{story.title}</h1>

          <p className={styles.meta}>{story.summary}</p>

          {story.body && <p className={styles.description}>{story.body}</p>}

          {story.link && (
            <p className={styles.actions}>
              <a href={story.link} target="_blank" rel="noopener noreferrer" className="btn">
                {en ? "Open" : "Отвори"}
              </a>
            </p>
          )}
        </article>
      );
    }
  }
}