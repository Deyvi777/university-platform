"use server";

import { revalidatePath } from "next/cache";
import { MeApiError, mutateMe } from "@/lib/api/teacher";
import type { ActionResult } from "@/app/dashboard/admin-types";

function errorMessage(error: unknown): string {
  if (error instanceof MeApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Error inesperado";
}

/** Marca/desmarca un contenido como completado por el estudiante. */
export async function setProgressAction(
  moduleId: string,
  contentId: string,
  completed: boolean,
): Promise<ActionResult> {
  try {
    await mutateMe("PUT", `/me/contents/${contentId}/progress`, { completed });
    revalidatePath(`/dashboard/aula/${moduleId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

/** Guarda los apuntes personales del estudiante sobre un contenido. */
export async function setNoteAction(
  moduleId: string,
  contentId: string,
  body: string,
): Promise<ActionResult> {
  try {
    await mutateMe("PUT", `/me/contents/${contentId}/note`, { body });
    revalidatePath(`/dashboard/aula/${moduleId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
