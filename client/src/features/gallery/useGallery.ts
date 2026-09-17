import { useEffect, useState } from "react";
import { getPhotos } from "../../api/photos";
import type { Lang, PhotoItem } from "../../api/types";

export type GalleryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; photos: PhotoItem[] };

type Answer = { lang: Lang; state: GalleryState };

export function useGallery(lang: Lang): GalleryState {
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getPhotos(lang, controller.signal)
      .then((photos) => setAnswer({ lang, state: { status: "ready", photos } }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        const message = error instanceof Error ? error.message : "Unknown error";
        setAnswer({ lang, state: { status: "error", message } });
      });

    return () => controller.abort();
  }, [lang]);

  if (answer === null || answer.lang !== lang) {
    return { status: "loading" };
  }

  return answer.state;
}
