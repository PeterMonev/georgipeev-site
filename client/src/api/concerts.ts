import { getJson } from "./client";
import type { ConcertDetail, ConcertListItem, Lang } from "./types";

export function getUpcomingConcerts(lang: Lang, signal?: AbortSignal) {
  return getJson<ConcertListItem[]>(`/api/concerts?lang=${lang}`, signal);
}

export function getConcert(slug: string, lang: Lang, signal?: AbortSignal) {
  return getJson<ConcertDetail>(
    // encodeURIComponent, always. A slug is data, and data can contain
    // characters that mean something in a URL. Building URLs by gluing strings
    // is how injection bugs are born.
    `/api/concerts/${encodeURIComponent(slug)}?lang=${lang}`,
    signal,
  );
}