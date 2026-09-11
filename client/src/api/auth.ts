import { getJson, post, postJson } from "./client";
import type { CurrentUser } from "./types";

export function getCurrentUser(signal?: AbortSignal) {
  return getJson<CurrentUser>("/api/auth/me", signal);
}

export function login(email: string, password: string) {
  return postJson<CurrentUser>("/api/auth/login", { email, password });
}

export function logout() {
  return post("/api/auth/logout");
}