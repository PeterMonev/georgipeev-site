import { del, getJson, postJson, putJson } from "./client";
import type { ConcertAdminDetail, ConcertAdminListItem, ConcertInput } from "./types";

const base = "/api/admin/concerts";

export function listAdminConcerts(signal?: AbortSignal) {
  return getJson<ConcertAdminListItem[]>(base, signal);
}

export function getAdminConcert(id: string, signal?: AbortSignal) {
  return getJson<ConcertAdminDetail>(`${base}/${encodeURIComponent(id)}`, signal);
}

export function createConcert(input: ConcertInput) {
  return postJson<ConcertAdminDetail>(base, input);
}

export function updateConcert(id: string, input: ConcertInput) {
  return putJson<ConcertAdminDetail>(`${base}/${encodeURIComponent(id)}`, input);
}

export function deleteConcert(id: string) {
  return del(`${base}/${encodeURIComponent(id)}`);
}
