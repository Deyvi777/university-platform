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
  activityFileUrl?: string | null;
  activityFileName?: string | null;
  dueDate?: string | null;
  maxScore?: number | null;
  weight?: number | null;
  isOffline?: boolean;
  // QUIZ/EXAM — ajustes del motor de preguntas.
  timeLimitMin?: number | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  singleAttempt?: boolean | null;
  shuffle?: boolean | null;
  revealAnswers?: boolean | null;
  // Examen de recuperación (solo al crear, sobre un módulo concluido).
  recoveryStage?: "RECUPERATORIO" | "SEGUNDA_INSTANCIA" | null;
  // FOLDER: lista completa de archivos (reemplaza en update).
  files?: { name: string; url: string; size?: number | null }[];
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

// ── Cronograma de clases ─────────────────────────────────────────────────────

export interface ClassSessionPayload {
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:mm" */
  startTime: string;
  /** "HH:mm" o null */
  endTime?: string | null;
  title?: string | null;
  location?: string | null;
}

export async function createSessionAction(
  moduleId: string,
  payload: ClassSessionPayload,
) {
  return run(moduleId, () =>
    mutateMe("POST", `/me/modules/${moduleId}/schedule`, payload),
  );
}

export async function updateSessionAction(
  moduleId: string,
  sessionId: string,
  payload: ClassSessionPayload,
) {
  return run(moduleId, () =>
    mutateMe("PATCH", `/me/schedule/${sessionId}`, payload),
  );
}

export async function deleteSessionAction(moduleId: string, sessionId: string) {
  return run(moduleId, () => mutateMe("DELETE", `/me/schedule/${sessionId}`));
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
