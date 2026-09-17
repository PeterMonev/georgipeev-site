import { useState } from "react";
import type { Lang, PhotoItem } from "../../api/types";
import styles from "./Gallery.module.css";
import { Lightbox } from "./Lightbox";
import { useGallery } from "./useGallery";

export function GalleryPage({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const state = useGallery(lang);
  const [open, setOpen] = useState<number | null>(null);

  function step(photos: PhotoItem[], delta: 1 | -1) {
    // Wraps around: the last picture's "next" is the first.
    setOpen((current) => (current === null ? null : (current + delta + photos.length) % photos.length));
  }

  return (
    <section>
      <div className={styles.head}>
        <p className="kicker">{en ? "Pictures" : "Снимки"}</p>
        <h2>{en ? "Gallery" : "Галерия"}</h2>
      </div>

      {state.status === "loading" && <p>{en ? "Loading…" : "Зарежда се…"}</p>}

      {state.status === "error" && (
        <p role="alert" className="alert">
          {en ? "Could not load the gallery." : "Галерията не се зареди."}
        </p>
      )}

      {state.status === "ready" && state.photos.length === 0 && (
        <p className={styles.empty}>{en ? "The gallery is filling up." : "Галерията се пълни."}</p>
      )}

      {state.status === "ready" && state.photos.length > 0 && (
        <>
          <ul className={styles.grid}>
            {state.photos.map((photo, index) => (
              // Two shapes only, chosen by the picture itself: a wide frame
              // for landscapes, a tall one for portraits. Everything else
              // is a crop, centred on the focal point Georgi picked.
              <li key={photo.urls.small} className={photo.width >= photo.height ? styles.land : styles.port}>
                <button type="button" className={styles.frame} onClick={() => setOpen(index)}>
                  <img
                    src={photo.urls.small}
                    // The browser picks the smallest file that fills the slot
                    // on this screen: 400 px on a phone, 900 px on a desktop.
                    srcSet={`${photo.urls.small} 400w, ${photo.urls.medium} 900w, ${photo.urls.large} 1600w`}
                    sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: `${photo.focusX * 100}% ${photo.focusY * 100}%` }}
                  />
                </button>
              </li>
            ))}
          </ul>

          <Lightbox
            lang={lang}
            photos={state.photos}
            index={open}
            onClose={() => setOpen(null)}
            onStep={(delta) => step(state.photos, delta)}
          />
        </>
      )}
    </section>
  );
}
