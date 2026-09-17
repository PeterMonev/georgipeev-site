import type { KeyboardEvent, MouseEvent } from "react";
import type { Lang, PhotoUrls } from "../../../api/types";
import styles from "./photos.module.css";

export type Focus = { x: number; y: number };

/**
 * Click where the eye should land. The two previews on the right are the
 * crops the site actually makes — a square for the grid, a wide strip for a
 * page header — so the effect of the click is visible at once.
 */
export function FocusPicker({
  lang,
  urls,
  alt,
  value,
  onChange,
}: {
  lang: Lang;
  urls: PhotoUrls;
  alt: string;
  value: Focus;
  onChange: (focus: Focus) => void;
}) {
  const en = lang === "en";

  function pick(event: MouseEvent<HTMLImageElement>) {
    // Where the click landed as a fraction of the picture, whatever size it
    // is drawn at on this screen.
    const box = event.currentTarget.getBoundingClientRect();
    onChange({
      x: clamp((event.clientX - box.left) / box.width),
      y: clamp((event.clientY - box.top) / box.height),
    });
  }

  function nudge(event: KeyboardEvent<HTMLDivElement>) {
    const step = 0.02;
    const moves: Partial<Record<string, Focus>> = {
      ArrowLeft: { x: value.x - step, y: value.y },
      ArrowRight: { x: value.x + step, y: value.y },
      ArrowUp: { x: value.x, y: value.y - step },
      ArrowDown: { x: value.x, y: value.y + step },
    };
    const next = moves[event.key];
    if (next === undefined) return;

    event.preventDefault();
    onChange({ x: clamp(next.x), y: clamp(next.y) });
  }

  // The same CSS the public site uses: object-position takes the crop's
  // centre as two percentages.
  const position = `${value.x * 100}% ${value.y * 100}%`;

  return (
    <div className={styles.picker}>
      <div
        className={styles.stage}
        role="slider"
        tabIndex={0}
        aria-label={en ? "Focal point" : "Фокус на кадъра"}
        aria-valuetext={`${Math.round(value.x * 100)}%, ${Math.round(value.y * 100)}%`}
        onKeyDown={nudge}
      >
        <img src={urls.medium} alt={alt} onClick={pick} draggable={false} />
        <span
          className={styles.marker}
          style={{ left: `${value.x * 100}%`, top: `${value.y * 100}%` }}
          aria-hidden="true"
        />
      </div>

      <div className={styles.previews}>
        <figure>
          <img src={urls.small} alt="" className={styles.square} style={{ objectPosition: position }} />
          <figcaption>{en ? "Grid" : "В мрежата"}</figcaption>
        </figure>
        <figure>
          <img src={urls.small} alt="" className={styles.wide} style={{ objectPosition: position }} />
          <figcaption>{en ? "Wide" : "Широко"}</figcaption>
        </figure>
      </div>
    </div>
  );
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));
