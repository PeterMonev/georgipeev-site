import { useState } from "react";
import { Link, Route, Routes } from "react-router";
import type { Lang } from "./api/types";
import { AdminHome } from "./features/admin/AdminHome";
import { AuthProvider } from "./features/auth/AuthProvider";
import { ChangePasswordPage } from "./features/auth/ChangePasswordPage";
import { LoginPage } from "./features/auth/LoginPage";
import { RequireAuth } from "./features/auth/RequireAuth";
import { ConcertList } from "./features/concerts/ConcertList";
import { ConcertPage } from "./features/concerts/ConcertPage";

export default function App() {
  const [lang, setLang] = useState<Lang>("bg");

  return (
    <AuthProvider>
      <main>
        <h1>
          <Link to="/">Георги Пеев</Link>
        </h1>

        <button type="button" onClick={() => setLang(lang === "bg" ? "en" : "bg")}>
          {lang === "bg" ? "English" : "Български"}
        </button>

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

          <Route path="/admin/login" element={<LoginPage lang={lang} />} />

          {/* Everything nested here renders only for a signed-in user.
              RequireAuth has no path of its own — it is a gate, not a page. */}
          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<AdminHome lang={lang} />} />
            <Route path="/admin/parola" element={<ChangePasswordPage lang={lang} />} />
          </Route>

          <Route
            path="*"
            element={<h2>{lang === "en" ? "Page not found" : "Страницата я няма"}</h2>}
          />
        </Routes>
      </main>
    </AuthProvider>
  );
}