import { useState, type FormEvent } from "react";
import { changePassword } from "../../api/auth";
import { ApiError, type FieldErrors } from "../../api/client";
import type { Lang } from "../../api/types";
import { translateIdentityErrors } from "./identityMessages";

type Outcome =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "done" }
  | { status: "failed"; errors: FieldErrors };

export function ChangePasswordPage({ lang }: { lang: Lang }) {
  const en = lang === "en";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [outcome, setOutcome] = useState<Outcome>({ status: "idle" });

  // Errors exist in exactly one state; everywhere else the form shows none.
  const errors: FieldErrors = outcome.status === "failed" ? outcome.errors : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // The one check the server cannot make: it never sees the confirmation.
    if (newPassword !== confirmation) {
      setOutcome({
        status: "failed",
        errors: { confirmation: [en ? "The passwords do not match." : "Паролите не съвпадат."] },
      });
      return;
    }

    setOutcome({ status: "submitting" });

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setOutcome({ status: "done" });
    } catch (caught: unknown) {
      // A 400 carries error codes per field. Anything else gets one generic
      // line under the form, keyed like a field so it renders the same way.
      const failure: FieldErrors =
        caught instanceof ApiError && caught.status === 400
          ? translateIdentityErrors(caught.errors, lang)
          : {
              form: [
                en ? "Could not change the password. Try again." : "Смяната не се получи. Опитай пак.",
              ],
            };

      setOutcome({ status: "failed", errors: failure });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{en ? "Change password" : "Смяна на паролата"}</h2>

      <label>
        {en ? "Current password" : "Сегашна парола"}
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <FieldError messages={errors.currentPassword} />

      <label>
        {en ? "New password" : "Нова парола"}
        {/* minLength mirrors the server rule for instant feedback; the server
            still decides. */}
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          required
          minLength={12}
        />
      </label>
      <FieldError messages={errors.newPassword} />

      <label>
        {en ? "New password again" : "Новата парола още веднъж"}
        <input
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="new-password"
          required
        />
      </label>
      <FieldError messages={errors.confirmation} />

      <FieldError messages={errors.form} />

      {outcome.status === "done" && (
        <p role="status">{en ? "The password is changed." : "Паролата е сменена."}</p>
      )}

      <button type="submit" disabled={outcome.status === "submitting"}>
        {outcome.status === "submitting"
          ? en ? "Saving…" : "Запис…"
          : en ? "Change" : "Смени"}
      </button>
    </form>
  );
}

/** Renders nothing when there is nothing to say, so the caller need not check. */
function FieldError({ messages }: { messages: string[] | undefined }) {
  if (messages === undefined || messages.length === 0) return null;

  return <p role="alert">{messages.join(" ")}</p>;
}