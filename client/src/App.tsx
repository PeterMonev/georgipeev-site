import { useState } from "react";
import { Link, Route, Routes } from "react-router";
import type { Lang } from "./api/types";
import { ConcertList } from "./features/concerts/ConcertList";
import { ConcertPage } from "./features/concerts/ConcertPage";

export default function App() {
  const [lang, setLang] = useState<Lang>("bg");

  return (
    <main>
      <h1>
        <Link to="/">Георги Пеев</Link>
      </h1>

      <button type="button" onClick={() => setLang(lang === "bg" ? "en" : "bg")}>
        {lang === "bg" ? "English" : "Български"}
      </button>

      {/* The table of contents of the site. Routes picks the first pattern that
          matches the current address; everything else is ignored. */}
      <Routes>
        <Route
          path="/"
          element={
            <>
              <h2>{lang === "en" ? "Upcoming" : "Предстоящи участия"}</h2>
              <ConcertList lang={lang} />
            </>
          }
        />

        <Route path="/koncerti/:slug" element={<ConcertPage lang={lang} />} />

        {/* The star matches anything the routes above did not. Without it an
            unknown address renders nothing at all — a blank page with no clue. */}
        <Route
          path="*"
          element={<h2>{lang === "en" ? "Page not found" : "Страницата я няма"}</h2>}
        />
      </Routes>
    </main>
  );
}