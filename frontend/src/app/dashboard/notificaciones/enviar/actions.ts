"use server";

import { revalidatePath } from "next/cache";
import { AdminApiError, mutateAdmin } from "@/lib/api/admin";
import { handleAdminActionError } from "@/lib/auth-guard";
import type { ActionResult } from "@/app/dashboard/admin-types";

export type NotificationAudience =
  | "ALL"
  | "PROFESSORS"
  | "STUDENTS"
  | "SELECTED";

export interface SendNotificationPayload {
  audience: NotificationAudience;
  userIds?: string[];
  title: string;
  body: string;
}

/**
 * Envía un aviso del administrador a la audiencia indicada (rol completo o lista
 * de usuarios). Devuelve cuántas notificaciones se crearon. Revalida la bandeja
 * de los destinatarios para que la vean al cargar.
 */
export async function sendNotificationAction(
  payload: SendNotificationPayload,
): Promise<ActionResult<{ count: number }>> {
  try {
    const result = await mutateAdmin<{ count: number }>(
      "POST",
      "/admin/notifications",
      payload,
    );
    // Los destinatarios verán el aviso al (re)cargar su panel; el historial de
    // la página de envío se actualiza al instante.
    revalidatePath("/dashboard/notificaciones/enviar");
    revalidatePath("/dashboard/notificaciones");
    revalidatePath("/dashboard", "layout");
    return { ok: true, data: result };
  } catch (error) {
    handleAdminActionError(error); // 401 → /login; rethrow del control de flujo
    return { ok: false, error: errorMessage(error) };
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof AdminApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Error inesperado";
}
