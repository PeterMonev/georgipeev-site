import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getStory } from "../../api/news";
import type { Lang, NewsDetail } from "../../api/types";

export type StoryState =
  | { status: "loading" }
  | { status: "notFound" }
  | { status: "error"; message: string }
  | { status: "ready"; story: NewsDetail };

type Answer = { slug: string; lang: Lang; state: StoryState };

export function useStory(slug: string | undefined, lang: Lang): StoryState {
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    if (slug === undefined) return;

    const controller = new AbortController();

    getStory(slug, lang, controller.signal)
      .then((story) => setAnswer({ slug, lang, state: { status: "ready", story } }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

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