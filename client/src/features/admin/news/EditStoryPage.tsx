import { Link, useParams } from "react-router";
import type { Lang } from "../../../api/types";
import a from "../../../styles/admin.module.css";
import { NewsForm } from "./NewsForm";
import { useAdminStory } from "./useAdminStory";

export function EditStoryPage({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const { id } = useParams<{ id: string }>();
  const state = useAdminStory(id);

  switch (state.status) {
    case "loading":
      return <p>{en ? "Loading…" : "Зарежда се…"}</p>;

    case "notFound":
      return (
        <p>
          {en ? "There is no such story." : "Няма такава новина."}{" "}
          <Link to="/admin/news">{en ? "Back to the list" : "Към списъка"}</Link>
        </p>
      );

    case "error":
      return (
        <p role="alert" className="alert">
          {en ? "Could not load the story." : "Новината не се зареди."}
        </p>
      );

    case "ready":
      return (
        <section>
          <div className={a.head}>
            <div>
              <p className="kicker">{en ? "News" : "Новини"}</p>
              <h2>{en ? "Edit story" : "Редакция на новина"}</h2>
            </div>
          </div>
          <NewsForm key={state.story.id} lang={lang} story={state.story} />
        </section>
      );
  }
}