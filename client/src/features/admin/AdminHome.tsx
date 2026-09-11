import { Link } from "react-router";
import type { Lang } from "../../api/types";
import { useAuth } from "../auth/useAuth";

export function AdminHome({ lang }: { lang: Lang }) {
  const { state, signOut } = useAuth();

  // RequireAuth already guaranteed this. The check here is for TypeScript:
  // narrowing the union so state.user exists on the next line.
  if (state.status !== "signedIn") return null;

  return (
    <section>
      <h2>{lang === "en" ? "Admin" : "Админ"}</h2>
      <p>{state.user.email}</p>
      <p>
        <Link to="/admin/parola">{lang === "en" ? "Change password" : "Смяна на паролата"}</Link>
      </p>
      <button
        type="button"
        onClick={() => {
          // The UI already forgets the user in `finally`; a failed server call
          // has nothing left to tell us, so it is swallowed here on purpose.
          signOut().catch(() => {});
        }}
      >
        {lang === "en" ? "Sign out" : "Изход"}
      </button>
    </section>
  );
}