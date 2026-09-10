import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getConcert } from "../../api/concerts";
import type { ConcertDetail, Lang } from "../../api/types";

/**
 * Four states this time. "Not found" is not an error: nothing went wrong, the
 * address simply names a concert that does not exist. Folding it into "error"
 * would make the page apologise for a working system.
 */
export type ConcertState =
  | { status: "loading" }
  | { status: "notFound" }
  | { status: "error"; message: string }
  | { status: "ready"; concert: ConcertDetail };

/** An answer, together with what it was an answer to. */
type Answer = { slug: string; lang: Lang; state: ConcertState };

export function useConcert(slug: string | undefined, lang: Lang): ConcertState {
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    // The check lives inside the effect, not above it. Hooks must be called in
    // the same order on every single render — an early return before useEffect
    // would skip it on some renders and React would lose track of which state
    // belongs to which hook.
    if (slug === undefined) return;

    const controller = new AbortController();

    getConcert(slug, lang, controller.signal)
      .then((concert) => setAnswer({ slug, lang, state: { status: "ready", concert } }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        // This is what ApiError.status was for. A 404 is an answer, not a
        // failure, and the page should say so in its own words.
        if (error instanceof ApiError && error.status === 404) {
          setAnswer({ slug, lang, state: { status: "notFound" } });
          return;
        }

        const message = error instanceof Error ? error.message : "Unknown error";
        setAnswer({ slug, lang, state: { status: "error", message } });
      });

    return () => controller.abort();
  }, [slug, lang]);

  if (slug === undefined) return { status: "notFound" };

  if (answer === null || answer.slug !== slug || answer.lang !== lang) {
    return { status: "loading" };
  }

  return answer.state;
}