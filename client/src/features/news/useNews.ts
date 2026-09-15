import { useEffect, useState } from "react";
import { getNews } from "../../api/news";
import type { Lang, NewsListItem } from "../../api/types";

export type NewsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; stories: NewsListItem[] };

type Answer = { lang: Lang; state: NewsState };

export function useNews(lang: Lang): NewsState {
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getNews(lang, controller.signal)
      .then((stories) => setAnswer({ lang, state: { status: "ready", stories } }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        const message = error instanceof Error ? error.message : "Unknown error";
        setAnswer({ lang, state: { status: "error", message } });
      });

    return () => controller.abort();
  }, [lang]);

  if (answer === null || answer.lang !== lang) {
    return { status: "loading" };
  }

  return answer.state;
}