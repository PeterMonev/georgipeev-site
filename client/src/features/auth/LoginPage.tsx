import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { ApiError } from "../../api/client";
import type { Lang } from "../../api/types";
import f from "../../styles/form.module.css";
import { useAuth } from "./useAuth";

export function LoginPage({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const { state, signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already signed in? There is nothing to do here.
  if (state.status === "signedIn") {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // The browser's default is to submit the form and reload the page. We are
    // handling it ourselves, so that default must be cancelled.
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      navigate("/admin", { replace: true });
    } catch (caught: unknown) {
      // 401 is "wrong email or password" — one message for both, on purpose.
      // Anything else is a real failure and the user deserves to know.
      const message =
        caught instanceof ApiError && caught.status === 401
          ? en
            ? "Wrong email or password."
            : "Грешен имейл или парола."
          : en
            ? "Could not sign in. Try again."
            : "Входът не се получи. Опитай пак.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${f.card} glass panel`}>
      <div className={f.title}>
        <p className="kicker">{en ? "Admin" : "Админ"}</p>
        <h2>{en ? "Sign in" : "Вход"}</h2>
      </div>

      <label className={f.field}>
        <span>{en ? "Email" : "Имейл"}</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
        />
      </label>

      <label className={f.field}>
        <span>{en ? "Password" : "Парола"}</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}

      <div className={f.actions}>
        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting
            ? en ? "Signing in…" : "Влизане…"
            : en ? "Sign in" : "Вход"}
        </button>
      </div>
    </form>
  );
}
