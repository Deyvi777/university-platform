"use server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export interface EnrollmentRequestPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idDocument: string;
  issuedIn: string;
  gender: "MALE" | "FEMALE";
  originUniversity: string;
  profession: string;
  programTitle: string;
  programSlug: string;
}

export type EnrollmentActionResult =
  | { ok: true }
  | { ok: false; error: string };

/** Envía la solicitud de inscripción al endpoint público del backend. */
export async function submitEnrollmentAction(
  payload: EnrollmentRequestPayload,
): Promise<EnrollmentActionResult> {
  try {
    const res = await fetch(`${API_URL}/enrollment-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        message?: string | string[];
      } | null;
      const message = Array.isArray(data?.message)
        ? data.message[0]
        : data?.message;
      return {
        ok: false,
        error: message ?? "No se pudo enviar la solicitud. Intenta de nuevo.",
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "No se pudo enviar la solicitud. Intenta de nuevo.",
    };
  }
}
