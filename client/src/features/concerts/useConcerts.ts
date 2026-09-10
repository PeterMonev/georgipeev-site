import { useEffect, useState } from "react";
import { getUpcomingConcerts } from "../../api/concerts";
import type { ConcertListItem, Lang } from "../../api/types";

/** An answer, together with the language it was an answer to. */
type Result =
  | { lang: Lang; concerts: ConcertListItem[]; error: null }
  | { lang: Lang; concerts: null; error: string };

type ConcertsState = {
  concerts: ConcertListItem[] | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * Hides how concerts are fetched. Components ask and get three values back;
 * whether that is fetch, a caching library or something else is not their
 * business. Changing the mechanism later means editing this one file.
 */
export function useConcerts(lang: Lang): ConcertsState {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    // AbortController does more than a "cancelled" boolean would: it tells the
    // browser to drop the request. The server sees that as a cancelled
    // CancellationToken and stops the database query mid-flight.
    const controller = new AbortController();

    getUpcomingConcerts(lang, controller.signal)
      .then((concerts) => setResult({ lang, concerts, error: null }))
      .catch((error: unknown) => {
        // An aborted request is not a failure — the component simply moved on.
        if (controller.signal.aborted) return;

        const message = error instanceof Error ? error.message : "Unknown error";
        setResult({ lang, concerts: null, error: message });
      });

    return () => controller.abort();
  }, [lang]);

  // Loading is not stored, it is worked out: "no answer yet for the language
  // being asked about right now". Storing it would cost an extra render and
  // would let the two values drift apart.
  if (result === null || result.lang !== lang) {
    return { concerts: null, isLoading: true, error: null };
  }

  return { concerts: result.concerts, isLoading: false, error: result.error };
}