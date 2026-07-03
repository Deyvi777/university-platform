"use server";

import { revalidatePath } from "next/cache";
import { MeApiError, mutateMe } from "@/lib/api/teacher";
import type { ActionResult } from "@/app/dashboard/admin-types";

export interface SubmitPayload {
  content?: string | null;
  fileUrl?: string | null;
  /** Archivos de una entrega de Proyecto (PROJECT). */
  files?: { name: string; url: string; size: number | null }[];
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

/**
 * Borra el archivo de la entrega del estudiante. Si la entrega tenía solo el
 * archivo, la entrega completa se elimina (vuelve a "Sin entregar").
 */
export async function removeSubmissionFileAction(
  courseId: string,
  activityId: string,
): Promise<ActionResult> {
  try {
    await mutateMe("DELETE", `/me/activities/${activityId}/submission-file`);
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
