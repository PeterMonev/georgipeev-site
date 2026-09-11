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
      <button type="button" onClick={() => void signOut()}>
        {lang === "en" ? "Sign out" : "Изход"}
      </button>
    </section>
  );
}