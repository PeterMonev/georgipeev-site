import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import type { Lang, PhotoItem } from "../../api/types";
import styles from "./Gallery.module.css";

/**
 * The full-size view. A native <dialog> does the hard parts for free: it
 * sits above everything, traps keyboard focus inside itself, closes on
 * Escape, and gives us a backdrop to click. No library, no z-index wars.
 */
export function Lightbox({
  lang,
  photos,
  index,
  onClose,
  onStep,
}: {
  lang: Lang;
  photos: PhotoItem[];
  /** Which photo is open, or null for closed. */
  index: number | null;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
}) {
  const en = lang === "en";
  const dialog = useRef<HTMLDialogElement>(null);

  // React renders the element; only the browser can open it as a modal.
  useEffect(() => {
    const element = dialog.current;
    if (element === null) return;

    if (index !== null && !element.open) element.showModal();
    if (index === null && element.open) element.close();
  }, [index]);

  const photo = index === null ? null : photos[index];

  function handleKey(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowRight") onStep(1);
    if (event.key === "ArrowLeft") onStep(-1);
  }

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    // A click on the dialog itself — not on its children — is the backdrop.
    if (event.target === event.currentTarget) onClose();
  }

  return (
    // onClose fires for Escape too, so the React state follows the browser.
    <dialog
      ref={dialog}
      className={styles.lightbox}
      onClose={onClose}
      onKeyDown={handleKey}
      onClick={handleClick}
      aria-label={en ? "Picture" : "Снимка"}
    >
      {photo && (
        <figure className={styles.figure}>
          <img
            src={photo.urls.large}
            srcSet={`${photo.urls.medium} 900w, ${photo.urls.large} 1600w`}
            sizes="100vw"
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
          />
          {photo.alt && <figcaption>{photo.alt}</figcaption>}
        </figure>
      )}

      <button
        type="button"
        className={`${styles.nav} ${styles.prev}`}
        onClick={() => onStep(-1)}
        aria-label={en ? "Previous" : "Предишна"}
      >
        ←
      </button>
      <button
        type="button"
        className={`${styles.nav} ${styles.next}`}
        onClick={() => onStep(1)}
        aria-label={en ? "Next" : "Следваща"}
      >
        →
      </button>
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label={en ? "Close" : "Затвори"}
      >
        ×
      </button>
    </dialog>
  );
}
