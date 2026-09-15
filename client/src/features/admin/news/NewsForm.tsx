import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { createStory, updateStory } from "../../../api/adminNews";
import { ApiError, type FieldErrors } from "../../../api/client";
import { translateErrors } from "../../../api/errorMessages";
import type { Lang, Localized, NewsAdminDetail, NewsInput } from "../../../api/types";
import { FieldError } from "../../../components/FieldError";
import { LocalizedField } from "../../../components/LocalizedField";
import { slugify } from "../../../lib/slugify";
import { fromSofiaLocal, toSofiaLocal } from "../../../lib/sofiaTime";
import f from "../../../styles/form.module.css";

type FormValues = {
  /** null until edited: the address is then derived from the Bulgarian title. */
  slug: string | null;
  /** "2026-09-11" — a story is a day, so the input is a date, not a datetime. */
  publishedAt: string;
  title: Localized;
  summary: Localized;
  body: Localized;
  link: string;
  isPublished: boolean;
};

type Outcome =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "saved" }
  | { status: "failed"; errors: FieldErrors };

const empty: Localized = { bg: "", en: "" };

/** Today in Sofia, as "YYYY-MM-DD" — the natural default for a new story. */
const today = () => toSofiaLocal(new Date().toISOString()).slice(0, "2026-09-11".length);

function initialValues(story: NewsAdminDetail | undefined): FormValues {
  if (story === undefined) {
    return {
      slug: null,
      publishedAt: today(),
      title: empty,
      summary: empty,
      body: empty,
      link: "",
      isPublished: false,
    };
  }

  return {
    slug: story.slug,
    publishedAt: toSofiaLocal(story.publishedAt).slice(0, "2026-09-11".length),
    title: story.title,
    summary: story.summary,
    body: story.body,
    link: story.link ?? "",
    isPublished: story.isPublished,
  };
}

const trim = (text: Localized): Localized => ({ bg: text.bg.trim(), en: text.en.trim() });

export function NewsForm({ lang, story }: { lang: Lang; story?: NewsAdminDetail }) {
  const en = lang === "en";
  const navigate = useNavigate();

  const [values, setValues] = useState<FormValues>(() => initialValues(story));
  const [version, setVersion] = useState(story?.version ?? 0);
  const [outcome, setOutcome] = useState<Outcome>({ status: "idle" });

  const errors: FieldErrors = outcome.status === "failed" ? outcome.errors : {};

  // The address follows the Bulgarian title until someone edits it by hand.
  const slug = values.slug ?? slugify(values.title.bg);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOutcome({ status: "submitting" });

    const input: NewsInput = {
      slug,
      // A date becomes the start of that day in Sofia.
      publishedAt: fromSofiaLocal(`${values.publishedAt}T00:00`),
      title: trim(values.title),
      summary: trim(values.summary),
      body: trim(values.body),
      link: values.link.trim() === "" ? null : values.link.trim(),
      isPublished: values.isPublished,
      version,
    };

    try {
      if (story === undefined) {
        await createStory(input);
        navigate("/admin/news");
        return;
      }

      const saved = await updateStory(story.id, input);
      setVersion(saved.version);
      setOutcome({ status: "saved" });
    } catch (caught: unknown) {
      setOutcome({ status: "failed", errors: describeFailure(caught, lang) });
    }
  }

  return (
    <form onSubmit={handleSubmit} className={f.form}>
      <label className={f.field}>
        <span>{en ? "Date" : "Дата"}</span>
        <input
          type="date"
          value={values.publishedAt}
          onChange={(event) => set("publishedAt", event.target.value)}
          required
        />
      </label>
      <FieldError messages={errors.publishedAt} />

      <LocalizedField
        label={en ? "Title" : "Заглавие"}
        value={values.title}
        onChange={(value) => set("title", value)}
        messages={errors.title}
        maxLength={200}
        required
      />

      <label className={f.field}>
        <span>{en ? "Address" : "Адрес"}</span>
        <input
          value={slug}
          onChange={(event) => set("slug", event.target.value)}
          maxLength={120}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
        />
      </label>
      <small className={f.hint}>/news/{slug}</small>
      <FieldError messages={errors.slug} />

      <LocalizedField
        label={en ? "Summary" : "Кратко"}
        value={values.summary}
        onChange={(value) => set("summary", value)}
        messages={errors.summary}
        maxLength={400}
        rows={3}
        required
      />

      <LocalizedField
        label={en ? "Text" : "Текст"}
        value={values.body}
        onChange={(value) => set("body", value)}
        messages={errors.body}
        maxLength={8000}
        rows={12}
      />

      <label className={f.field}>
        <span>{en ? "Link" : "Линк"}</span>
        <input
          type="url"
          value={values.link}
          onChange={(event) => set("link", event.target.value)}
          maxLength={400}
        />
      </label>
      <FieldError messages={errors.link} />

      <label className={f.check}>
        <input
          type="checkbox"
          checked={values.isPublished}
          onChange={(event) => set("isPublished", event.target.checked)}
        />
        {en ? "Published" : "Публикувана"}
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

function describeFailure(caught: unknown, lang: Lang): FieldErrors {
  const en = lang === "en";

  if (caught instanceof ApiError) {
    switch (caught.status) {
      case 400:
        return translateErrors(caught.errors, lang);

      case 404:
        return { form: [en ? "This story has been deleted." : "Тази новина е изтрита."] };

      case 409:
        return {
          form: [
            en
              ? "Someone else saved this story while you were editing it. Reload the page to see their changes."
              : "Някой друг е записал тази новина, докато я редактираше. Презареди страницата, за да видиш промените.",
          ],
        };
    }
  }

  return { form: [en ? "Could not save. Try again." : "Записът не се получи. Опитай пак."] };
}