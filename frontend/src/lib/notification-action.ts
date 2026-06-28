import type { NotificationType } from "@/lib/api/notifications";

/** Acción de "ir a…" derivada de una notificación (botón en campana/bandeja). */
export interface NotificationAction {
  href: string;
  label: string;
  /** Distingue el icono a usar en la UI. */
  kind: "chat" | "activity";
}

function strOf(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * Construye el botón de acción de una notificación a partir de su tipo + `data`
 * y el rol del usuario:
 * - MESSAGE → "Ir al chat" (aula del módulo para estudiante, workspace para
 *   docente/admin) con `?chat=<remitente>`.
 * - ACTIVITY_PUBLISHED → "Ir a la actividad" (aula del módulo) con
 *   `?content=<actividad>` para seleccionarla. Siempre va a estudiantes.
 * Devuelve `null` si la notificación no tiene una acción navegable.
 */
export function notificationActionFor(
  type: NotificationType,
  data: Record<string, unknown> | null | undefined,
  role: string | undefined,
): NotificationAction | null {
  if (!data) return null;

  if (type === "MESSAGE" && data.chat === true) {
    const moduleId = strOf(data.moduleId);
    if (!moduleId) return null;
    const fromUserId = strOf(data.fromUserId);
    const base =
      role === "STUDENT"
        ? `/dashboard/aula/${moduleId}`
        : `/dashboard/modulos/${moduleId}`;
    const href = fromUserId
      ? `${base}?chat=${encodeURIComponent(fromUserId)}`
      : `${base}?chat=1`;
    return { href, label: "Ir al chat", kind: "chat" };
  }

  if (type === "ACTIVITY_PUBLISHED") {
    const moduleId = strOf(data.moduleId);
    if (!moduleId) return null;
    const activityId = strOf(data.activityId);
    const href = activityId
      ? `/dashboard/aula/${moduleId}?content=${encodeURIComponent(activityId)}`
      : `/dashboard/aula/${moduleId}`;
    return { href, label: "Ir a la actividad", kind: "activity" };
  }

  return null;
}
