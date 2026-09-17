/**
 * The only place in the app where HTTP happens. Everything above this file
 * deals in typed values and thrown errors, never in Response objects.
 */

/**
 * Per-field messages, keyed the way the server keys them ("newPassword").
 * Partial, because a key that was not sent is undefined — and the type
 * should say so, or every lookup would be a silent lie.
 */
export type FieldErrors = Partial<Record<string, string[]>>;

export class ApiError extends Error {
  readonly status: number;
  /** Filled from a 400 validation response; empty for every other failure. */
  readonly errors: FieldErrors;

  constructor(status: number, message: string, errors: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

/**
 * The body ASP.NET Core sends with a failed request (RFC 9457, "problem
 * details"). Only the members we read are listed; extra ones are ignored.
 */
type ProblemDetails = {
  title?: string;
  errors?: FieldErrors;
};

/**
 * A type guard: the return type "value is ProblemDetails" tells TypeScript
 * that inside an `if` which calls this, `value` may be treated as that type.
 * The runtime check and the compile-time narrowing are one and the same.
 */
function isProblemDetails(value: unknown): value is ProblemDetails {
  return typeof value === "object" && value !== null && ("title" in value || "errors" in value);
}

/** JSON.parse that answers "not JSON" with undefined instead of throwing. */
function parseJson(text: string): unknown {
  try {
    // JSON.parse returns `any`. The declared return type stops it here, at
    // the door, so nothing above this line ever sees an `any`.
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * The validator names fields the C# way ("TicketUrl"); the JSON body names
 * them "ticketUrl". One spelling everywhere, decided here and nowhere else.
 */
function camelCaseKeys(errors: FieldErrors): FieldErrors {
  return Object.fromEntries(
    Object.entries(errors).map(([key, messages]) => [
      key.charAt(0).toLowerCase() + key.slice(1),
      messages,
    ]),
  );
}

/**
 * The error for a failed response, whoever made the request. fetch and the
 * XMLHttpRequest uploader both end up here, so every failure looks the same
 * to the code above.
 */
export function failure(status: number, statusText: string, body: string): ApiError {
  const problem = parseJson(body);

  if (isProblemDetails(problem)) {
    return new ApiError(status, problem.title ?? statusText, camelCaseKeys(problem.errors ?? {}));
  }

  return new ApiError(status, body || statusText);
}

async function throwIfFailed(response: Response): Promise<void> {
  if (response.ok) return;

  // A failed response often carries a useful body. Read it before throwing,
  // otherwise the caller only ever sees a bare status number.
  const text = await response.text().catch(() => "");
  throw failure(response.status, response.statusText, text);
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

/**
 * One function makes every request; the exported ones below only decide what
 * to send and what to read back. A header added here reaches every call.
 */
async function send(
  method: Method,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };

  // Only announce a JSON body when there is one.
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  await throwIfFailed(response);
  return response;
}

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await send("GET", path, undefined, signal);
  return (await response.json()) as T;
}

/** POST a JSON body and read a JSON body back. */
export async function postJson<TResponse>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<TResponse> {
  const response = await send("POST", path, body, signal);
  return (await response.json()) as TResponse;
}

/** PUT a JSON body and read the updated resource back. */
export async function putJson<TResponse>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<TResponse> {
  const response = await send("PUT", path, body, signal);
  return (await response.json()) as TResponse;
}

/**
 * POST and expect nothing back (204) — sign-out, change password. Kept
 * separate from postJson so the return type is honest: there is nothing to
 * return, and pretending otherwise would need a cast.
 */
export async function post(path: string, body?: unknown, signal?: AbortSignal): Promise<void> {
  await send("POST", path, body, signal);
}

/** PUT a JSON body and expect nothing back (204) — reordering, for instance. */
export async function put(path: string, body: unknown, signal?: AbortSignal): Promise<void> {
  await send("PUT", path, body, signal);
}

/** DELETE, expecting 204. Named `del` because `delete` is a reserved word. */
export async function del(path: string, signal?: AbortSignal): Promise<void> {
  await send("DELETE", path, undefined, signal);
}
