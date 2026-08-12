"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export type EvaluationAnswerPayload = {
  questionId: string;
  scaleValue?: number | null;
  selectedOptions: string[];
  textValue?: string | null;
};

export async function submitTeacherEvaluationAction(
  moduleId: string,
  teacherId: string,
  answers: EvaluationAnswerPayload[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return { ok: false, error: "Tu sesión expiró" };

  const response = await fetch(
    `${API_URL}/me/modules/${encodeURIComponent(moduleId)}/teacher-evaluations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ teacherId, answers }),
    },
  );
  if (!response.ok) {
    let error = "No se pudo guardar la evaluación";
    try {
      const body = (await response.json()) as { message?: string | string[] };
      error = Array.isArray(body.message)
        ? body.message.join(", ")
        : body.message || error;
    } catch {
      // Respuesta sin JSON.
    }
    return { ok: false, error };
  }

  revalidatePath(`/dashboard/aula/${moduleId}/evaluacion`);
  revalidatePath(`/dashboard/aula/${moduleId}`);
  revalidatePath("/dashboard/mis-programas");
  return { ok: true };
}
