import { useState } from "react";
import { Route, Routes } from "react-router";
import type { Lang } from "./api/types";
import { Layout } from "./components/Layout";
import { AdminHome } from "./features/admin/AdminHome";
import { ConcertsPage } from "./features/admin/concerts/ConcertsPage";
import { EditConcertPage } from "./features/admin/concerts/EditConcertPage";
import { NewConcertPage } from "./features/admin/concerts/NewConcertPage";
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
      <Layout lang={lang} onLang={setLang}>
        <Routes>
          <Route path="/" element={<ConcertList lang={lang} />} />

          <Route path="/koncerti/:slug" element={<ConcertPage lang={lang} />} />

          <Route path="/admin/login" element={<LoginPage lang={lang} />} />

          {/* Everything nested here renders only for a signed-in user.
              RequireAuth has no path of its own — it is a gate, not a page. */}
          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<AdminHome lang={lang} />} />
            <Route path="/admin/parola" element={<ChangePasswordPage lang={lang} />} />
            <Route path="/admin/koncerti" element={<ConcertsPage lang={lang} />} />
            <Route path="/admin/koncerti/nov" element={<NewConcertPage lang={lang} />} />
            <Route path="/admin/koncerti/:id" element={<EditConcertPage lang={lang} />} />
          </Route>

          <Route
            path="*"
            element={<h2>{lang === "en" ? "Page not found" : "Страницата я няма"}</h2>}
          />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}