import { getJson } from "./client";
import type { Lang, NewsDetail, NewsListItem } from "./types";

export function getNews(lang: Lang, signal?: AbortSignal) {
  return getJson<NewsListItem[]>(`/api/news?lang=${lang}`, signal);
}

export function getStory(slug: string, lang: Lang, signal?: AbortSignal) {
  return getJson<NewsDetail>(`/api/news/${encodeURIComponent(slug)}?lang=${lang}`, signal);
}