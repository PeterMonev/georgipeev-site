import { useCallback, useEffect, useState } from "react";
import { listAdminPhotos } from "../../../api/adminPhotos";
import type { PhotoAdminItem } from "../../../api/types";

export type AdminPhotosState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; photos: PhotoAdminItem[] };

/**
 * The gallery as the admin sees it, plus the three ways it changes without
 * a reload: a photo arrives, a photo goes, the order moves. Each is a local
 * edit of the list the server already confirmed.
 */
export function useAdminPhotos() {
  const [state, setState] = useState<AdminPhotosState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    listAdminPhotos(controller.signal)
      .then((photos) => setState({ status: "ready", photos }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        const message = error instanceof Error ? error.message : "Unknown error";
        setState({ status: "error", message });
      });

    return () => controller.abort();
  }, []);

  /** Applies a change to the list, or nothing while it has not loaded. */
  const change = useCallback((apply: (photos: PhotoAdminItem[]) => PhotoAdminItem[]) => {
    setState((previous) =>
      previous.status === "ready" ? { status: "ready", photos: apply(previous.photos) } : previous,
    );
  }, []);

  const add = useCallback((photo: PhotoAdminItem) => change((photos) => [...photos, photo]), [change]);

  const forget = useCallback(
    (id: string) => change((photos) => photos.filter((p) => p.id !== id)),
    [change],
  );

  const reorder = useCallback((photos: PhotoAdminItem[]) => change(() => photos), [change]);

  return { state, add, forget, reorder };
}
