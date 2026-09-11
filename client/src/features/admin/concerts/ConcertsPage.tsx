import { useState } from "react";
import { Link } from "react-router";
import { deleteConcert } from "../../../api/adminConcerts";
import type { ConcertAdminListItem, Lang } from "../../../api/types";
import { formatWhen } from "../../concerts/formatWhen";
import { useAdminConcerts } from "./useAdminConcerts";

export function ConcertsPage({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const { state, forget } = useAdminConcerts();
  const [problem, setProblem] = useState<string | null>(null);

  async function remove(concert: ConcertAdminListItem) {
    const question = en
      ? `Delete "${concert.venue}, ${concert.city}"?`
      : `Да изтрия ли „${concert.venue}, ${concert.city}“?`;
    if (!window.confirm(question)) return;

    try {
      await deleteConcert(concert.id);
      forget(concert.id);
    } catch {
      setProblem(en ? "Could not delete. Try again." : "Изтриването не се получи. Опитай пак.");
    }
  }

  return (
    <section>
      <h2>{en ? "Concerts" : "Концерти"}</h2>
      <p>
        <Link to="/admin/koncerti/nov">{en ? "New concert" : "Нов концерт"}</Link>
      </p>

      {problem && <p role="alert">{problem}</p>}

      {state.status === "loading" && <p>{en ? "Loading…" : "Зарежда се…"}</p>}

      {state.status === "error" && (
        <p role="alert">{en ? "Could not load concerts." : "Концертите не се заредиха."}</p>
      )}

      {state.status === "ready" && state.concerts.length === 0 && (
        <p>{en ? "No concerts yet." : "Още няма концерти."}</p>
      )}

      {state.status === "ready" && state.concerts.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>{en ? "When" : "Кога"}</th>
              <th>{en ? "Venue" : "Зала"}</th>
              <th>{en ? "City" : "Град"}</th>
              <th>{en ? "Status" : "Статус"}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.concerts.map((concert) => (
              <tr key={concert.id}>
                <td>
                  <time dateTime={concert.startsAt}>{formatWhen(concert.startsAt, lang)}</time>
                </td>
                <td>{concert.venue}</td>
                <td>{concert.city}</td>
                <td>
                  {concert.isPublished
                    ? en ? "Published" : "Публикуван"
                    : en ? "Draft" : "Чернова"}
                </td>
                <td>
                  <Link to={`/admin/koncerti/${concert.id}`}>{en ? "Edit" : "Редактирай"}</Link>{" "}
                  {/* remove() handles its own failure, so there is nothing
                      left for the caller to await — void says so. */}
                  <button type="button" onClick={() => void remove(concert)}>
                    {en ? "Delete" : "Изтрий"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
