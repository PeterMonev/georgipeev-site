import { Link, useParams } from "react-router";
import type { Lang } from "../../../api/types";
import a from "../../../styles/admin.module.css";
import { ConcertForm } from "./ConcertForm";
import { useAdminConcert } from "./useAdminConcert";

export function EditConcertPage({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const { id } = useParams<{ id: string }>();
  const state = useAdminConcert(id);

  switch (state.status) {
    case "loading":
      return <p>{en ? "Loading…" : "Зарежда се…"}</p>;

    case "notFound":
      return (
        <p>
          {en ? "There is no such concert." : "Няма такъв концерт."}{" "}
          <Link to="/admin/concerts">{en ? "Back to the list" : "Към списъка"}</Link>
        </p>
      );

    case "error":
      return <p role="alert">{en ? "Could not load the concert." : "Концертът не се зареди."}</p>;

    case "ready":
      return (
        <section>
          <div className={a.head}>
            <div>
              <p className="kicker">{en ? "Concerts" : "Концерти"}</p>
              <h2>{en ? "Edit concert" : "Редакция на концерт"}</h2>
            </div>
          </div>
          {/* The form reads its initial values once. Keying it by id makes
              React build a fresh form if the route changes to another concert
              instead of showing the old values under the new address. */}
          <ConcertForm key={state.concert.id} lang={lang} concert={state.concert} />
        </section>
      );
  }
}
