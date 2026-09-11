import { useEffect, useState } from "react";
import { getAdminConcert } from "../../../api/adminConcerts";
import { ApiError } from "../../../api/client";
import type { ConcertAdminDetail } from "../../../api/types";

export type AdminConcertState =
  | { status: "loading" }
  | { status: "notFound" }
  | { status: "error"; message: string }
  | { status: "ready"; concert: ConcertAdminDetail };

/** An answer, together with what it was an answer to. */
type Answer = { id: string; state: AdminConcertState };

/** One concert for the edit form — the same shape as useConcert, keyed by id. */
export function useAdminConcert(id: string | undefined): AdminConcertState {
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    // Inside the effect, not above it: hooks must run in the same order on
    // every render, and an early return before useEffect would break that.
    if (id === undefined) return;

    const controller = new AbortController();

    getAdminConcert(id, controller.signal)
      .then((concert) => setAnswer({ id, state: { status: "ready", concert } }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        if (error instanceof ApiError && error.status === 404) {
          setAnswer({ id, state: { status: "notFound" } });
          return;
        }

        const message = error instanceof Error ? error.message : "Unknown error";
        setAnswer({ id, state: { status: "error", message } });
      });

    return () => controller.abort();
  }, [id]);

  if (id === undefined) return { status: "notFound" };

  if (answer === null || answer.id !== id) {
    return { status: "loading" };
  }

  return answer.state;
}
