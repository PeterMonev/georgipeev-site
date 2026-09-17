import { del, failure, getJson, put, putJson } from "./client";
import type { PhotoAdminItem, PhotoUpdate } from "./types";

const base = "/api/admin/photos";

export function listAdminPhotos(signal?: AbortSignal) {
  return getJson<PhotoAdminItem[]>(base, signal);
}

export function getAdminPhoto(id: string, signal?: AbortSignal) {
  return getJson<PhotoAdminItem>(`${base}/${encodeURIComponent(id)}`, signal);
}

export function updatePhoto(id: string, update: PhotoUpdate) {
  return putJson<PhotoAdminItem>(`${base}/${encodeURIComponent(id)}`, update);
}

/** The whole gallery order, first to last. */
export function reorderPhotos(ids: string[]) {
  return put(`${base}/order`, ids);
}

export function deletePhoto(id: string) {
  return del(`${base}/${encodeURIComponent(id)}`);
}

/**
 * fetch cannot report how much of a request body has been sent, and a 20 MB
 * upload on a phone with no progress bar looks like a hang. XMLHttpRequest
 * is the older API, and the only one with an upload progress event — so this
 * one function uses it, and hands back the same promise and the same
 * ApiError the rest of the app expects.
 */
export function uploadPhoto(
  file: File,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<PhotoAdminItem> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", base);
    request.setRequestHeader("Accept", "application/json");

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    });

    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(JSON.parse(request.responseText) as PhotoAdminItem);
      } else {
        reject(failure(request.status, request.statusText, request.responseText));
      }
    });

    request.addEventListener("error", () => reject(new Error("Network error")));
    request.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    signal?.addEventListener("abort", () => request.abort());

    // The field name is what the server binds to: `IFormFile file`.
    const form = new FormData();
    form.append("file", file);
    request.send(form);
  });
}
