import { useEffect, useState } from "react";
import { getAdminPhoto } from "../../../api/adminPhotos";
import { ApiError } from "../../../api/client";
import type { PhotoAdminItem } from "../../../api/types";

export type AdminPhotoState =
  | { status: "loading" }
  | { status: "notFound" }
  | { status: "error"; message: string }
  | { status: "ready"; photo: PhotoAdminItem };

type Answer = { id: string; state: AdminPhotoState };

export function useAdminPhoto(id: string | undefined): AdminPhotoState {
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    if (id === undefined) return;

    const controller = new AbortController();

    getAdminPhoto(id, controller.signal)
      .then((photo) => setAnswer({ id, state: { status: "ready", photo } }))
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
