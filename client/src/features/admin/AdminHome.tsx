import { Link } from "react-router";
import type { Lang } from "../../api/types";
import a from "../../styles/admin.module.css";
import { useAuth } from "../auth/useAuth";

export function AdminHome({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const { state, signOut } = useAuth();

  // RequireAuth already guaranteed this. The check here is for TypeScript:
  // narrowing the union so state.user exists on the next line.
  if (state.status !== "signedIn") return null;

  return (
    <section>
      <div className={a.head}>
        <div>
          <p className="kicker">{en ? "Admin" : "Админ"}</p>
          <h2>{en ? "Hello" : "Здравей"}</h2>
        </div>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => {
            // The UI already forgets the user in `finally`; a failed server call
            // has nothing left to tell us, so it is swallowed here on purpose.
            signOut().catch(() => {});
          }}
        >
          {en ? "Sign out" : "Изход"}
        </button>
      </div>

      <p className={a.email}>{state.user.email}</p>

      <ul className={a.links}>
        <li>
          <Link to="/admin/concerts">{en ? "Concerts" : "Концерти"}</Link>
        </li>
        <li>
          <Link to="/admin/password">{en ? "Change password" : "Смяна на паролата"}</Link>
        </li>
                <li>
          <Link to="/admin/news">{en ? "News" : "Новини"}</Link>
        </li>
      </ul>
    </section>
  );
}
