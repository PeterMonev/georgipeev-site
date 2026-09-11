import type { Lang } from "../../../api/types";
import { ConcertForm } from "./ConcertForm";

export function NewConcertPage({ lang }: { lang: Lang }) {
  return (
    <section>
      <h2>{lang === "en" ? "New concert" : "Нов концерт"}</h2>
      <ConcertForm lang={lang} />
    </section>
  );
}
