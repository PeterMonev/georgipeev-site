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
import { EditStoryPage } from "./features/admin/news/EditStoryPage";
import { NewsAdminPage } from "./features/admin/news/NewsAdminPage";
import { NewStoryPage } from "./features/admin/news/NewStoryPage";
import { NewsList } from "./features/news/NewsList";
import { StoryPage } from "./features/news/StoryPage";

export default function App() {
  const [lang, setLang] = useState<Lang>("bg");

  return (
    <AuthProvider>
      <Layout lang={lang} onLang={setLang}>
        <Routes>
          <Route path="/" element={<ConcertList lang={lang} />} />

          <Route path="/concerts/:slug" element={<ConcertPage lang={lang} />} />

          <Route path="/news" element={<NewsList lang={lang} />} />
          <Route path="/news/:slug" element={<StoryPage lang={lang} />} />

          <Route path="/admin/login" element={<LoginPage lang={lang} />} />

          {/* Everything nested here renders only for a signed-in user.
              RequireAuth has no path of its own — it is a gate, not a page. */}
          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<AdminHome lang={lang} />} />
            <Route path="/admin/password" element={<ChangePasswordPage lang={lang} />} />
            <Route path="/admin/concerts" element={<ConcertsPage lang={lang} />} />
            <Route path="/admin/concerts/new" element={<NewConcertPage lang={lang} />} />
            <Route path="/admin/concerts/:id" element={<EditConcertPage lang={lang} />} />
            
            <Route path="/admin/news" element={<NewsAdminPage lang={lang} />} />
            <Route path="/admin/news/new" element={<NewStoryPage lang={lang} />} />
            <Route path="/admin/news/:id" element={<EditStoryPage lang={lang} />} />
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