import { useEffect, useState } from "react";
import { getUpcomingConcerts } from "../../api/concerts";
import type { ConcertListItem, Lang } from "../../api/types";

/**
 * The three states a request can be in, and nothing else. A shape with three
 * independent fields would allow eight combinations, five of them nonsense —
 * "loading and failed", "done but empty and no error", and so on. Here those
 * cannot be written down, so they cannot happen.
 */
export type ConcertsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; concerts: ConcertListItem[] };

/** An answer, together with the language it was an answer to. */
type Answer = { lang: Lang; state: ConcertsState };

export function useConcerts(lang: Lang): ConcertsState {
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    // AbortController does more than a "cancelled" boolean would: it tells the
    // browser to drop the request. The server sees that as a cancelled
    // CancellationToken and stops the database query mid-flight.
    const controller = new AbortController();

    getUpcomingConcerts(lang, controller.signal)
      .then((concerts) => setAnswer({ lang, state: { status: "ready", concerts } }))
      .catch((error: unknown) => {
        // An aborted request is not a failure — the component simply moved on.
        if (controller.signal.aborted) return;

        const message = error instanceof Error ? error.message : "Unknown error";
        setAnswer({ lang, state: { status: "error", message } });
      });

    return () => controller.abort();
  }, [lang]);

  // Loading is not stored, it is worked out: "no answer yet for the language
  // being asked about right now".
  if (answer === null || answer.lang !== lang) {
    return { status: "loading" };
  }

  return answer.state;
}