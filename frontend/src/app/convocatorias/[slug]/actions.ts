"use server";

import type { CallApplicationAnswerPayload } from "@/lib/api/calls";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export type CallSubmitResult =
  | { ok: true; applicationId: string }
  | { ok: false; error: string };

export async function submitCallApplicationAction(
  slug: string,
  answers: CallApplicationAnswerPayload[],
): Promise<CallSubmitResult> {
  const response = await fetch(
    `${API_URL}/calls/${encodeURIComponent(slug)}/applications`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
      cache: "no-store",
    },
  );
  const body = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string | string[];
  };
  if (!response.ok || !body.id) {
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : (body.message ?? "No se pudo enviar la postulación");
    return { ok: false, error: message };
  }
  return { ok: true, applicationId: body.id };
}
