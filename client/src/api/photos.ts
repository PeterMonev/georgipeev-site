import { getJson } from "./client";
import type { Lang, PhotoItem } from "./types";

export function getPhotos(lang: Lang, signal?: AbortSignal) {
  return getJson<PhotoItem[]>(`/api/photos?lang=${lang}`, signal);
}
