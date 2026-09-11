import type { Lang } from "../../../api/types";
import a from "../../../styles/admin.module.css";
import { ConcertForm } from "./ConcertForm";

export function NewConcertPage({ lang }: { lang: Lang }) {
  return (
    <section>
      <div className={a.head}>
        <div>
          <p className="kicker">{lang === "en" ? "Concerts" : "Концерти"}</p>
          <h2>{lang === "en" ? "New concert" : "Нов концерт"}</h2>
        </div>
      </div>
      <ConcertForm lang={lang} />
    </section>
  );
}
