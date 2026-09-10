import { getJson } from "./client";
import type { ConcertListItem, Lang } from "./types";

export function getUpcomingConcerts(lang: Lang, signal?: AbortSignal) {
  return getJson<ConcertListItem[]>(`/api/concerts?lang=${lang}`, signal);
}