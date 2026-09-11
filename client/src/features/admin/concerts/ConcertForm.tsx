import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { createConcert, updateConcert } from "../../../api/adminConcerts";
import { ApiError, type FieldErrors } from "../../../api/client";
import { translateErrors } from "../../../api/errorMessages";
import type { ConcertAdminDetail, ConcertInput, Lang, Localized } from "../../../api/types";
import { FieldError } from "../../../components/FieldError";
import f from "../../../styles/form.module.css";
import { suggestSlug } from "./slugify";
import { fromSofiaLocal, toSofiaLocal } from "./sofiaTime";

/**
 * What the inputs hold — text everywhere, because inputs speak text. The
 * typed ConcertInput is built from this once, at submit.
 */
type FormValues = {
  /** null until edited: the address is then derived from the date and city. */
  slug: string | null;
  /** "2026-12-05T19:30", Sofia wall clock, as the datetime-local input gives it. */
  startsAt: string;
  venue: Localized;
  city: Localized;
  note: Localized;
  description: Localized;
  ticketUrl: string;
  isPublished: boolean;
};

type Outcome =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "saved" }
  | { status: "failed"; errors: FieldErrors };

const empty: Localized = { bg: "", en: "" };

function initialValues(concert: ConcertAdminDetail | undefined): FormValues {
  if (concert === undefined) {
    return {
      slug: null,
      startsAt: "",
      venue: empty,
      city: empty,
      note: empty,
      description: empty,
      ticketUrl: "",
      isPublished: false,
    };
  }

  return {
    slug: concert.slug,
    startsAt: toSofiaLocal(concert.startsAt),
    venue: concert.venue,
    city: concert.city,
    note: concert.note,
    description: concert.description,
    ticketUrl: concert.ticketUrl ?? "",
    isPublished: concert.isPublished,
  };
}

const trim = (text: Localized): Localized => ({ bg: text.bg.trim(), en: text.en.trim() });

/** One form for both jobs: no `concert` means create, a concert means edit. */
export function ConcertForm({ lang, concert }: { lang: Lang; concert?: ConcertAdminDetail }) {
  const en = lang === "en";
  const navigate = useNavigate();

  // The function form runs once, on the first render, instead of rebuilding
  // the initial values on every keystroke and throwing them away.
  const [values, setValues] = useState<FormValues>(() => initialValues(concert));
  const [version, setVersion] = useState(concert?.version ?? 0);
  const [outcome, setOutcome] = useState<Outcome>({ status: "idle" });

  const errors: FieldErrors = outcome.status === "failed" ? outcome.errors : {};

  // Derived, not stored: while the address has not been touched it follows
  // the date and the city. The moment it is edited, values.slug takes over.
  const slug = values.slug ?? suggestSlug(values.startsAt, values.city.bg);

  /**
   * One setter for every field. K is "whichever key you pass" and
   * FormValues[K] is "the type of that key", so set("isPublished", "yes")
   * is a compile error rather than a bug found by Georgi.
   */
  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOutcome({ status: "submitting" });

    const input: ConcertInput = {
      slug,
      startsAt: fromSofiaLocal(values.startsAt),
      venue: trim(values.venue),
      city: trim(values.city),
      note: trim(values.note),
      description: trim(values.description),
      // An empty box means "no link"; null is how the API says that.
      ticketUrl: values.ticketUrl.trim() === "" ? null : values.ticketUrl.trim(),
      isPublished: values.isPublished,
      version,
    };

    try {
      if (concert === undefined) {
        await createConcert(input);
        navigate("/admin/koncerti");
        return;
      }

      // The server answers with the new row version. Keeping it means a
      // second save from the same form does not look like a conflict.
      const saved = await updateConcert(concert.id, input);
      setVersion(saved.version);
      setOutcome({ status: "saved" });
    } catch (caught: unknown) {
      setOutcome({ status: "failed", errors: describeFailure(caught, lang) });
    }
  }

  return (
    <form onSubmit={handleSubmit} className={f.form}>
      <label className={f.field}>
        <span>{en ? "Date and time (Sofia)" : "Дата и час (София)"}</span>
        <input
          type="datetime-local"
          value={values.startsAt}
          onChange={(event) => set("startsAt", event.target.value)}
          required
        />
      </label>
      <FieldError messages={errors.startsAt} />

      <LocalizedField
        label={en ? "City" : "Град"}
        value={values.city}
        onChange={(value) => set("city", value)}
        messages={errors.city}
        maxLength={120}
        required
      />

      <LocalizedField
        label={en ? "Venue" : "Зала"}
        value={values.venue}
        onChange={(value) => set("venue", value)}
        messages={errors.venue}
        maxLength={200}
        required
      />

      <label className={f.field}>
        <span>{en ? "Address" : "Адрес"}</span>
        {/* The browser checks the same rule the server does, so the usual
            mistake — a capital letter, a space — is caught before sending. */}
        <input
          value={slug}
          onChange={(event) => set("slug", event.target.value)}
          maxLength={120}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
        />
      </label>
      <small className={f.hint}>/koncerti/{slug}</small>
      <FieldError messages={errors.slug} />

      <LocalizedField
        label={en ? "Note" : "Бележка"}
        value={values.note}
        onChange={(value) => set("note", value)}
        messages={errors.note}
        maxLength={200}
      />

      <LocalizedField
        label={en ? "Description" : "Описание"}
        value={values.description}
        onChange={(value) => set("description", value)}
        messages={errors.description}
        maxLength={2000}
        multiline
      />

      <label className={f.field}>
        <span>{en ? "Ticket link" : "Линк за билети"}</span>
        <input
          type="url"
          value={values.ticketUrl}
          onChange={(event) => set("ticketUrl", event.target.value)}
          maxLength={400}
        />
      </label>
      <FieldError messages={errors.ticketUrl} />

      <label className={f.check}>
        <input
          type="checkbox"
          checked={values.isPublished}
          onChange={(event) => set("isPublished", event.target.checked)}
        />
        {en ? "Published" : "Публикуван"}
      </label>

      <FieldError messages={errors.form} />
      {outcome.status === "saved" && (
        <p role="status" className="status">
          {en ? "Saved." : "Записано."}
        </p>
      )}

      <div className={f.actions}>
        <button type="submit" className="btn" disabled={outcome.status === "submitting"}>
          {outcome.status === "submitting"
            ? en ? "Saving…" : "Запис…"
            : en ? "Save" : "Запази"}
        </button>
      </div>
    </form>
  );
}

/**
 * Two inputs that behave as one field. `keyof Localized` is the union
 * "bg" | "en" — computed from the type, so it cannot drift from it.
 */
function LocalizedField({
  label,
  value,
  onChange,
  messages,
  maxLength,
  required = false,
  multiline = false,
}: {
  label: string;
  value: Localized;
  onChange: (value: Localized) => void;
  messages: string[] | undefined;
  maxLength: number;
  required?: boolean;
  multiline?: boolean;
}) {
  const input = (key: keyof Localized) => {
    const shared = {
      value: value[key],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange({ ...value, [key]: event.target.value }),
      maxLength,
      // Only the Bulgarian half is ever required — the server rule, mirrored.
      required: required && key === "bg",
    };

    return multiline ? <textarea rows={6} {...shared} /> : <input {...shared} />;
  };

  return (
    <fieldset className={f.pair}>
      <legend className={f.legend}>{label}</legend>
      <div className={f.halves}>
        <label className={f.field}>
          <span>БГ</span>
          {input("bg")}
        </label>
        <label className={f.field}>
          <span>EN</span>
          {input("en")}
        </label>
      </div>
      <FieldError messages={messages} />
    </fieldset>
  );
}

/** Every way a save can fail, as messages under the fields they belong to. */
function describeFailure(caught: unknown, lang: Lang): FieldErrors {
  const en = lang === "en";

  if (caught instanceof ApiError) {
    switch (caught.status) {
      case 400:
        return translateErrors(caught.errors, lang);

      case 404:
        return { form: [en ? "This concert has been deleted." : "Този концерт е изтрит."] };

      case 409:
        return {
          form: [
            en
              ? "Someone else saved this concert while you were editing it. Reload the page to see their changes."
              : "Някой друг е записал този концерт, докато го редактираше. Презареди страницата, за да видиш промените.",
          ],
        };
    }
  }

  return { form: [en ? "Could not save. Try again." : "Записът не се получи. Опитай пак."] };
}
