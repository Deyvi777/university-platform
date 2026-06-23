"use server";

import { revalidatePath } from "next/cache";
import { MeApiError, mutateMe } from "@/lib/api/teacher";
import type { ActivityType, ContentKind } from "@/lib/api/teacher";
import type { ActionResult } from "@/app/dashboard/admin-types";

export interface ContentPayload {
  kind?: ContentKind;
  title: string;
  isPublished?: boolean;
  body?: string | null;
  videoUrl?: string | null;
  materialType?: "FILE" | "LINK" | null;
  url?: string | null;
  activityType?: ActivityType | null;
  instructions?: string | null;
  dueDate?: string | null;
  maxScore?: number | null;
  weight?: number | null;
  isOffline?: boolean;
}

function errorMessage(error: unknown): string {
  if (error instanceof MeApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Error inesperado";
}

async function run(
  moduleId: string,
  fn: () => Promise<unknown>,
): Promise<ActionResult> {
  try {
    await fn();
    revalidatePath(`/dashboard/modulos/${moduleId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function createContentAction(
  moduleId: string,
  payload: ContentPayload,
) {
  return run(moduleId, () =>
    mutateMe("POST", `/me/modules/${moduleId}/contents`, payload),
  );
}

export async function updateContentAction(
  moduleId: string,
  contentId: string,
  payload: ContentPayload,
) {
  return run(moduleId, () =>
    mutateMe("PATCH", `/me/contents/${contentId}`, payload),
  );
}

export async function deleteContentAction(moduleId: string, contentId: string) {
  return run(moduleId, () => mutateMe("DELETE", `/me/contents/${contentId}`));
}

export async function reorderContentsAction(
  moduleId: string,
  orderedIds: string[],
) {
  return run(moduleId, () =>
    mutateMe("PUT", `/me/modules/${moduleId}/contents/reorder`, { orderedIds }),
  );
}

/** Guarda la observación del docente sobre la nota de módulo de un estudiante. */
export async function setObservationAction(
  moduleId: string,
  studentId: string,
  observations: string,
) {
  return run(moduleId, () =>
    mutateMe(
      "PUT",
      `/me/modules/${moduleId}/students/${studentId}/observation`,
      { observations },
    ),
  );
}

/**
 * Califica directamente a un estudiante en una actividad (presencial): el
 * docente carga el puntaje a mano desde la libreta. Reusa el endpoint de
 * calificación; recalcula la nota del módulo.
 */
export async function gradeStudentAction(
  moduleId: string,
  activityId: string,
  studentId: string,
  score: number,
) {
  return run(moduleId, () =>
    mutateMe(
      "PUT",
      `/me/activities/${activityId}/students/${studentId}/grade`,
      { score },
    ),
  );
}
