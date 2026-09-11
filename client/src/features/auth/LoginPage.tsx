import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { ApiError } from "../../api/client";
import type { Lang } from "../../api/types";
import { useAuth } from "./useAuth";

export function LoginPage({ lang }: { lang: Lang }) {
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
          ? lang === "en"
            ? "Wrong email or password."
            : "Грешен имейл или парола."
          : lang === "en"
            ? "Could not sign in. Try again."
            : "Входът не се получи. Опитай пак.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{lang === "en" ? "Sign in" : "Вход"}</h2>

      <label>
        {lang === "en" ? "Email" : "Имейл"}
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
        />
      </label>

      <label>
        {lang === "en" ? "Password" : "Парола"}
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? lang === "en" ? "Signing in…" : "Влизане…"
          : lang === "en" ? "Sign in" : "Вход"}
      </button>
    </form>
  );
}