"use server";

import { revalidatePath } from "next/cache";
import {
  AdminApiError,
  mutateAdmin,
  type TeacherEvaluationQuestion,
} from "@/lib/api/admin";
import { handleAdminActionError } from "@/lib/auth-guard";
import type { ActionResult } from "@/app/dashboard/admin-types";

export async function saveTeacherEvaluationQuestionnaireAction(
  questions: Array<
    Pick<
      TeacherEvaluationQuestion,
      "type" | "prompt" | "required" | "options"
    > & { id?: string }
  >,
): Promise<ActionResult<TeacherEvaluationQuestion[]>> {
  try {
    const saved = await mutateAdmin<TeacherEvaluationQuestion[]>(
      "PUT",
      "/admin/teacher-evaluations/questionnaire",
      { questions },
    );
    revalidatePath("/dashboard/evaluaciones-docentes");
    return { ok: true, data: saved };
  } catch (error) {
    handleAdminActionError(error);
    return {
      ok: false,
      error:
        error instanceof AdminApiError || error instanceof Error
          ? error.message
          : "No se pudo guardar el cuestionario",
    };
  }
}
