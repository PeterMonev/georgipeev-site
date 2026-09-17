import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { uploadPhoto } from "../../../api/adminPhotos";
import { ApiError } from "../../../api/client";
import { translateErrors } from "../../../api/errorMessages";
import type { Lang, PhotoAdminItem } from "../../../api/types";
import styles from "./photos.module.css";

/** One file on its way up, or the reason it did not make it. */
type Upload = {
  key: number;
  name: string;
  progress: number;
  status: "waiting" | "uploading" | "failed";
  message?: string;
};

/** Phones upload over slow links: three at a time keeps every bar moving. */
const parallel = 3;

export function UploadZone({
  lang,
  onUploaded,
}: {
  lang: Lang;
  onUploaded: (photo: PhotoAdminItem) => void;
}) {
  const en = lang === "en";
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [isOver, setIsOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  // Counters live in refs, not state: changing them must not re-render.
  const nextKey = useRef(0);
  const active = useRef(0);
  const queue = useRef<{ key: number; file: File }[]>([]);

  function patch(key: number, changes: Partial<Upload>) {
    setUploads((current) => current.map((u) => (u.key === key ? { ...u, ...changes } : u)));
  }

  function pump() {
    while (active.current < parallel && queue.current.length > 0) {
      const next = queue.current.shift()!;
      active.current += 1;
      patch(next.key, { status: "uploading" });

      uploadPhoto(next.file, (fraction) => patch(next.key, { progress: fraction }))
        .then((photo) => {
          // Done: the photo joins the grid and the bar has nothing left to say.
          setUploads((current) => current.filter((u) => u.key !== next.key));
          onUploaded(photo);
        })
        .catch((caught: unknown) => {
          patch(next.key, { status: "failed", message: describe(caught, lang) });
        })
        .finally(() => {
          active.current -= 1;
          pump();
        });
    }
  }

  function accept(files: FileList | null) {
    if (files === null) return;

    const added = [...files].map((file) => ({ key: nextKey.current++, file }));
    setUploads((current) => [
      ...current,
      ...added.map(({ key, file }) => ({ key, name: file.name, progress: 0, status: "waiting" as const })),
    ]);
    queue.current.push(...added);
    pump();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    // Without this the browser opens the file as a page — and the site is gone.
    event.preventDefault();
    setIsOver(false);
    accept(event.dataTransfer.files);
  }

  function handlePick(event: ChangeEvent<HTMLInputElement>) {
    accept(event.target.files);
    // Same file twice in a row would otherwise not fire a change event.
    event.target.value = "";
  }

  return (
    <div>
      {/* The zone is a button in every sense: click, Enter, drop. */}
      <div
        role="button"
        tabIndex={0}
        className={`${styles.zone} ${isOver ? styles.over : ""}`}
        onClick={() => input.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") input.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={handleDrop}
      >
        <strong>{en ? "Drop pictures here" : "Пусни снимките тук"}</strong>
        <span>{en ? "or tap to choose. JPEG, PNG, HEIC — up to 20 MB each." : "или цъкни, за да избереш. JPEG, PNG, HEIC — до 20 MB всяка."}</span>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handlePick}
        />
      </div>

      {uploads.length > 0 && (
        <ul className={styles.uploads}>
          {uploads.map((upload) => (
            <li key={upload.key} className={upload.status === "failed" ? styles.failed : ""}>
              <span className={styles.name}>{upload.name}</span>
              {upload.status === "failed" ? (
                <>
                  <span role="alert">{upload.message}</span>
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => setUploads((current) => current.filter((u) => u.key !== upload.key))}
                  >
                    {en ? "Dismiss" : "Затвори"}
                  </button>
                </>
              ) : (
                <progress max={1} value={upload.progress} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function describe(caught: unknown, lang: Lang): string {
  if (caught instanceof ApiError && caught.status === 400) {
    return Object.values(translateErrors(caught.errors, lang)).flat().join(" ");
  }

  return lang === "en" ? "Upload failed. Try again." : "Качването не се получи. Опитай пак.";
}
