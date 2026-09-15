import { useState } from "react";
import { Link } from "react-router";
import { deleteStory } from "../../../api/adminNews";
import type { Lang, NewsAdminListItem } from "../../../api/types";
import { formatDate } from "../../../lib/dates";
import a from "../../../styles/admin.module.css";
import { useAdminNews } from "./useAdminNews";

export function NewsAdminPage({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const { state, forget } = useAdminNews();
  const [problem, setProblem] = useState<string | null>(null);

  async function remove(story: NewsAdminListItem) {
    const question = en ? `Delete "${story.title}"?` : `Да изтрия ли „${story.title}“?`;
    if (!window.confirm(question)) return;

    try {
      await deleteStory(story.id);
      forget(story.id);
    } catch {
      setProblem(en ? "Could not delete. Try again." : "Изтриването не се получи. Опитай пак.");
    }
  }

  return (
    <section>
      <div className={a.head}>
        <div>
          <p className="kicker">{en ? "Admin" : "Админ"}</p>
          <h2>{en ? "News" : "Новини"}</h2>
        </div>
        <Link to="/admin/news/new" className="btn">
          {en ? "New story" : "Нова новина"}
        </Link>
      </div>

      {problem && (
        <p role="alert" className="alert">
          {problem}
        </p>
      )}

      {state.status === "loading" && <p>{en ? "Loading…" : "Зарежда се…"}</p>}

      {state.status === "error" && (
        <p role="alert" className="alert">
          {en ? "Could not load the news." : "Новините не се заредиха."}
        </p>
      )}

      {state.status === "ready" && state.stories.length === 0 && (
        <p>{en ? "No news yet." : "Още няма новини."}</p>
      )}

      {state.status === "ready" && state.stories.length > 0 && (
        <div className={a.wrap}>
          <table className={a.table}>
            <thead>
              <tr>
                <th>{en ? "Date" : "Дата"}</th>
                <th>{en ? "Title" : "Заглавие"}</th>
                <th>{en ? "Status" : "Статус"}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.stories.map((story) => (
                <tr key={story.id}>
                  <td>
                    <time dateTime={story.publishedAt}>{formatDate(story.publishedAt, lang)}</time>
                  </td>
                  <td>{story.title}</td>
                  <td>
                    <span className={`${a.badge} ${story.isPublished ? a.published : ""}`}>
                      {story.isPublished
                        ? en ? "Published" : "Публикувана"
                        : en ? "Draft" : "Чернова"}
                    </span>
                  </td>
                  <td>
                    <span className={a.rowActions}>
                      <Link to={`/admin/news/${story.id}`} className="btn btn-quiet">
                        {en ? "Edit" : "Редактирай"}
                      </Link>
                      <button
                        type="button"
                        className="btn btn-quiet btn-danger"
                        onClick={() => void remove(story)}
                      >
                        {en ? "Delete" : "Изтрий"}
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}