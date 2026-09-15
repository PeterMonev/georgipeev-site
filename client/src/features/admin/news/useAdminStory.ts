import { useEffect, useState } from "react";
import { getAdminStory } from "../../../api/adminNews";
import { ApiError } from "../../../api/client";
import type { NewsAdminDetail } from "../../../api/types";

export type AdminStoryState =
  | { status: "loading" }
  | { status: "notFound" }
  | { status: "error"; message: string }
  | { status: "ready"; story: NewsAdminDetail };

type Answer = { id: string; state: AdminStoryState };

export function useAdminStory(id: string | undefined): AdminStoryState {
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    if (id === undefined) return;

    const controller = new AbortController();

    getAdminStory(id, controller.signal)
      .then((story) => setAnswer({ id, state: { status: "ready", story } }))
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