"use server";

import { revalidatePath } from "next/cache";
import { MeApiError, mutateMe } from "@/lib/api/teacher";
import type { ActionResult } from "@/app/dashboard/admin-types";

export interface SubmitPayload {
  content?: string | null;
  fileUrl?: string | null;
}

/**
 * Entrega del estudiante para una actividad (texto y/o archivo). Revalida el
 * detalle del curso para reflejar el nuevo estado de la entrega.
 */
export async function submitActivityAction(
  courseId: string,
  activityId: string,
  payload: SubmitPayload,
): Promise<ActionResult> {
  try {
    await mutateMe("POST", `/me/activities/${activityId}/submit`, payload);
    revalidatePath(`/dashboard/mis-cursos/${courseId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    const message =
      error instanceof MeApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Error inesperado";
    return { ok: false, error: message };
  }
}
