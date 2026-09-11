import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";
import type { Lang } from "../api/types";
import { useAuth } from "../features/auth/useAuth";
import styles from "./Layout.module.css";

/**
 * The frame every page sits in: brand, navigation, language switch, and the
 * page itself in a centred column. Pages know nothing about any of this.
 */
export function Layout({
  lang,
  onLang,
  children,
}: {
  lang: Lang;
  onLang: (lang: Lang) => void;
  children: ReactNode;
}) {
  const { state } = useAuth();
  const en = lang === "en";

  return (
    <>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link to="/" className={styles.brand}>
            {en ? "Georgi Peev" : "Георги Пеев"}
          </Link>

          {/* NavLink knows whether its address is the current one and sets
              aria-current="page" — the CSS keys the underline off that. */}
          <nav className={styles.nav}>
            <NavLink to="/" end>
              {en ? "Concerts" : "Концерти"}
            </NavLink>
            {state.status === "signedIn" && (
              <NavLink to="/admin">{en ? "Admin" : "Админ"}</NavLink>
            )}
          </nav>

          <div className={styles.lang} role="group" aria-label={en ? "Language" : "Език"}>
            <button type="button" aria-pressed={!en} onClick={() => onLang("bg")}>
              БГ
            </button>
            <button type="button" aria-pressed={en} onClick={() => onLang("en")}>
              EN
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>© {new Date().getFullYear()} Георги Пеев</footer>
    </>
  );
}
