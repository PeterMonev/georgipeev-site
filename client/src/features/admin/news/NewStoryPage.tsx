import type { Lang } from "../../../api/types";
import a from "../../../styles/admin.module.css";
import { NewsForm } from "./NewsForm";

export function NewStoryPage({ lang }: { lang: Lang }) {
  return (
    <section>
      <div className={a.head}>
        <div>
          <p className="kicker">{lang === "en" ? "News" : "Новини"}</p>
          <h2>{lang === "en" ? "New story" : "Нова новина"}</h2>
        </div>
      </div>
      <NewsForm lang={lang} />
    </section>
  );
}