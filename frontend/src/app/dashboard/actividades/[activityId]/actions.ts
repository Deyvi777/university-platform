"use server";

import { revalidatePath } from "next/cache";
import { MeApiError, mutateMe } from "@/lib/api/teacher";
import type { ActionResult } from "@/app/dashboard/admin-types";

export interface GradePayload {
  score: number;
  feedback?: string | null;
}

/**
 * Califica la entrega de un estudiante para una actividad. El backend recalcula
 * la nota del módulo (ponderada). Revalida la página de calificación.
 */
export async function gradeSubmissionAction(
  activityId: string,
  studentId: string,
  payload: GradePayload,
): Promise<ActionResult> {
  try {
    await mutateMe(
      "PUT",
      `/me/activities/${activityId}/students/${studentId}/grade`,
      payload,
    );
    revalidatePath(`/dashboard/actividades/${activityId}`);
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
