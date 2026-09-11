/**
 * The only place in the app where HTTP happens. Everything above this file
 * deals in typed values and thrown errors, never in Response objects.
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    // A failed response often carries a useful message. Read it before throwing,
    // otherwise the caller only ever sees a bare status number.
    const body = await response.text().catch(() => "");
    throw new ApiError(response.status, body || response.statusText);
  }

  return (await response.json()) as T;
}

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

async function throwIfFailed(response: Response): Promise<void> {
  if (response.ok) return;

  const body = await response.text().catch(() => "");
  throw new ApiError(response.status, body || response.statusText);
}

/** POST a JSON body and read a JSON body back. */
export async function postJson<TResponse>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<TResponse> {
  const response = await fetch(path, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
    signal,
  });

  await throwIfFailed(response);
  return (await response.json()) as TResponse;
}

/**
 * POST with no body and no answer expected — sign-out, for instance. Kept
 * separate from postJson so the return type is honest: there is nothing to
 * return, and pretending otherwise would need a cast.
 */
export async function post(path: string, signal?: AbortSignal): Promise<void> {
  const response = await fetch(path, { method: "POST", headers: jsonHeaders, signal });
  await throwIfFailed(response);
}