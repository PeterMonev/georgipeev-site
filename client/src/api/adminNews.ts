import { del, getJson, postJson, putJson } from "./client";
import type { NewsAdminDetail, NewsAdminListItem, NewsInput } from "./types";

const base = "/api/admin/news";

export function listAdminNews(signal?: AbortSignal) {
  return getJson<NewsAdminListItem[]>(base, signal);
}

export function getAdminStory(id: string, signal?: AbortSignal) {
  return getJson<NewsAdminDetail>(`${base}/${encodeURIComponent(id)}`, signal);
}

export function createStory(input: NewsInput) {
  return postJson<NewsAdminDetail>(base, input);
}

export function updateStory(id: string, input: NewsInput) {
  return putJson<NewsAdminDetail>(`${base}/${encodeURIComponent(id)}`, input);
}

export function deleteStory(id: string) {
  return del(`${base}/${encodeURIComponent(id)}`);
}