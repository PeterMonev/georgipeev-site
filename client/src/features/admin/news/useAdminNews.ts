import { useCallback, useEffect, useState } from "react";
import { listAdminNews } from "../../../api/adminNews";
import type { NewsAdminListItem } from "../../../api/types";

export type AdminNewsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; stories: NewsAdminListItem[] };

export function useAdminNews() {
  const [state, setState] = useState<AdminNewsState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    listAdminNews(controller.signal)
      .then((stories) => setState({ status: "ready", stories }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        const message = error instanceof Error ? error.message : "Unknown error";
        setState({ status: "error", message });
      });

    return () => controller.abort();
  }, []);

  const forget = useCallback((id: string) => {
    setState((previous) =>
      previous.status === "ready"
        ? { status: "ready", stories: previous.stories.filter((s) => s.id !== id) }
        : previous,
    );
  }, []);

  return { state, forget };
}