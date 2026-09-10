import { useState } from "react";
import type { Lang } from "./api/types";
import { ConcertList } from "./features/concerts/ConcertList";

export default function App() {
  const [lang, setLang] = useState<Lang>("bg");

  return (
    <main>
      <h1>Георги Пеев</h1>

      <button type="button" onClick={() => setLang(lang === "bg" ? "en" : "bg")}>
        {lang === "bg" ? "English" : "Български"}
      </button>

      <h2>{lang === "en" ? "Upcoming" : "Предстоящи участия"}</h2>
      <ConcertList lang={lang} />
    </main>
  );
}