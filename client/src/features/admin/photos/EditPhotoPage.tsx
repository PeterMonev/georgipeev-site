import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { updatePhoto } from "../../../api/adminPhotos";
import { ApiError, type FieldErrors } from "../../../api/client";
import { translateErrors } from "../../../api/errorMessages";
import type { Lang, Localized, PhotoAdminItem } from "../../../api/types";
import { FieldError } from "../../../components/FieldError";
import { LocalizedField } from "../../../components/LocalizedField";
import a from "../../../styles/admin.module.css";
import f from "../../../styles/form.module.css";
import { FocusPicker, type Focus } from "./FocusPicker";
import { useAdminPhoto } from "./useAdminPhoto";

export function EditPhotoPage({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const { id } = useParams<{ id: string }>();
  const state = useAdminPhoto(id);

  switch (state.status) {
    case "loading":
      return <p>{en ? "Loading…" : "Зарежда се…"}</p>;

    case "notFound":
      return (
        <p>
          {en ? "There is no such picture." : "Няма такава снимка."}{" "}
          <Link to="/admin/photos">{en ? "Back to the pictures" : "Към снимките"}</Link>
        </p>
      );

    case "error":
      return (
        <p role="alert" className="alert">
          {en ? "Could not load the picture." : "Снимката не се зареди."}
        </p>
      );

    case "ready":
      return (
        <section>
          <div className={a.head}>
            <div>
              <p className="kicker">{en ? "Pictures" : "Снимки"}</p>
              <h2>{en ? "Edit picture" : "Редакция на снимка"}</h2>
            </div>
            <Link to="/admin/photos" className="btn btn-quiet">
              ← {en ? "All pictures" : "Всички снимки"}
            </Link>
          </div>
          <PhotoForm key={state.photo.id} lang={lang} photo={state.photo} />
        </section>
      );
  }
}

type Outcome =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "saved" }
  | { status: "failed"; errors: FieldErrors };

function PhotoForm({ lang, photo }: { lang: Lang; photo: PhotoAdminItem }) {
  const en = lang === "en";
  const [alt, setAlt] = useState<Localized>(photo.alt);
  const [focus, setFocus] = useState<Focus>({ x: photo.focusX, y: photo.focusY });
  const [isPublished, setIsPublished] = useState(photo.isPublished);
  const [outcome, setOutcome] = useState<Outcome>({ status: "idle" });

  const errors: FieldErrors = outcome.status === "failed" ? outcome.errors : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOutcome({ status: "submitting" });

    try {
      await updatePhoto(photo.id, {
        alt: { bg: alt.bg.trim(), en: alt.en.trim() },
        focusX: focus.x,
        focusY: focus.y,
        isPublished,
      });
      setOutcome({ status: "saved" });
    } catch (caught: unknown) {
      setOutcome({ status: "failed", errors: describeFailure(caught, lang) });
    }
  }

  return (
    <form onSubmit={handleSubmit} className={f.form}>
      <FocusPicker lang={lang} urls={photo.urls} alt={alt.bg} value={focus} onChange={setFocus} />
      <FieldError messages={errors.focusX} />
      <FieldError messages={errors.focusY} />

      <LocalizedField
        label={en ? "Description for screen readers and Google" : "Описание за екранни четци и Google"}
        value={alt}
        onChange={setAlt}
        messages={errors.alt}
        maxLength={300}
      />

      <label className={f.check}>
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(event) => setIsPublished(event.target.checked)}
        />
        {en ? "Shown in the gallery" : "Показва се в галерията"}
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
        return { form: [en ? "This picture has been deleted." : "Тази снимка е изтрита."] };
    }
  }

  return { form: [en ? "Could not save. Try again." : "Записът не се получи. Опитай пак."] };
}
