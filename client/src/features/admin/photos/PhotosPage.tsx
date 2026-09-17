import { useState } from "react";
import { Link } from "react-router";
import { deletePhoto, reorderPhotos } from "../../../api/adminPhotos";
import type { Lang, PhotoAdminItem } from "../../../api/types";
import a from "../../../styles/admin.module.css";
import styles from "./photos.module.css";
import { UploadZone } from "./UploadZone";
import { useAdminPhotos } from "./useAdminPhotos";

export function PhotosPage({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const { state, add, forget, reorder } = useAdminPhotos();
  const [problem, setProblem] = useState<string | null>(null);

  async function remove(photo: PhotoAdminItem) {
    if (!window.confirm(en ? "Delete this picture?" : "Да изтрия ли тази снимка?")) return;

    try {
      await deletePhoto(photo.id);
      forget(photo.id);
    } catch {
      setProblem(en ? "Could not delete. Try again." : "Изтриването не се получи. Опитай пак.");
    }
  }

  /**
   * Buttons, not drag-and-drop: Georgi will do this from a phone, where
   * dragging a thumbnail fights with scrolling. The list moves on screen
   * first and the server is told afterwards — if it disagrees, the list
   * snaps back.
   */
  async function move(photos: PhotoAdminItem[], from: number, to: number) {
    if (to < 0 || to >= photos.length) return;

    const next = [...photos];
    [next[from], next[to]] = [next[to]!, next[from]!];
    reorder(next);

    try {
      await reorderPhotos(next.map((p) => p.id));
    } catch {
      reorder(photos);
      setProblem(en ? "Could not save the order." : "Редът не се записа.");
    }
  }

  return (
    <section>
      <div className={a.head}>
        <div>
          <p className="kicker">{en ? "Admin" : "Админ"}</p>
          <h2>{en ? "Pictures" : "Снимки"}</h2>
        </div>
      </div>

      <UploadZone lang={lang} onUploaded={add} />

      {problem && (
        <p role="alert" className="alert">
          {problem}
        </p>
      )}

      {state.status === "loading" && <p>{en ? "Loading…" : "Зарежда се…"}</p>}

      {state.status === "error" && (
        <p role="alert" className="alert">
          {en ? "Could not load the pictures." : "Снимките не се заредиха."}
        </p>
      )}

      {state.status === "ready" && state.photos.length === 0 && (
        <p className={styles.empty}>{en ? "No pictures yet." : "Още няма снимки."}</p>
      )}

      {state.status === "ready" && state.photos.length > 0 && (
        <ul className={styles.grid}>
          {state.photos.map((photo, index) => (
            <li key={photo.id} className={photo.isPublished ? "" : styles.hidden}>
              <Link to={`/admin/photos/${photo.id}`} className={styles.thumb}>
                <img
                  src={photo.urls.small}
                  alt={photo.alt.bg}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  style={{ objectPosition: `${photo.focusX * 100}% ${photo.focusY * 100}%` }}
                />
                {!photo.isPublished && (
                  <span className={styles.badge}>{en ? "Hidden" : "Скрита"}</span>
                )}
              </Link>
              <div className={styles.tools}>
                <button
                  type="button"
                  className="btn btn-quiet"
                  aria-label={en ? "Move earlier" : "По-напред"}
                  disabled={index === 0}
                  onClick={() => void move(state.photos, index, index - 1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="btn btn-quiet"
                  aria-label={en ? "Move later" : "По-назад"}
                  disabled={index === state.photos.length - 1}
                  onClick={() => void move(state.photos, index, index + 1)}
                >
                  →
                </button>
                <button
                  type="button"
                  className="btn btn-quiet btn-danger"
                  onClick={() => void remove(photo)}
                >
                  {en ? "Delete" : "Изтрий"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
