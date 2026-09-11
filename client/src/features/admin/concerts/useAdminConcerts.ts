import { useCallback, useEffect, useState } from "react";
import { listAdminConcerts } from "../../../api/adminConcerts";
import type { ConcertAdminListItem } from "../../../api/types";

export type AdminConcertsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; concerts: ConcertAdminListItem[] };

/**
 * The admin's list of concerts, plus one way to change it: forgetting a
 * concert that was just deleted. The server already said 204 — asking it
 * for the whole list again would only be a slower way to learn the same.
 */
export function useAdminConcerts() {
  const [state, setState] = useState<AdminConcertsState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    listAdminConcerts(controller.signal)
      .then((concerts) => setState({ status: "ready", concerts }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        const message = error instanceof Error ? error.message : "Unknown error";
        setState({ status: "error", message });
      });

    return () => controller.abort();
  }, []);

  const forget = useCallback((id: string) => {
    // The updater form: React hands us the latest state, so this is safe even
    // if two deletes are confirmed in quick succession.
    setState((previous) =>
      previous.status === "ready"
        ? { status: "ready", concerts: previous.concerts.filter((c) => c.id !== id) }
        : previous,
    );
  }, []);

  return { state, forget };
}
