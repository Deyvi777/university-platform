import type { NotificationType } from "@/lib/api/notifications";

/** Acción de "ir a…" derivada de una notificación (botón en campana/bandeja). */
export interface NotificationAction {
  href: string;
  label: string;
  /** Distingue el icono a usar en la UI. */
  kind: "chat" | "activity" | "whatsapp";
  /** URL externa (wa.me): abrir en pestaña nueva, no navegación interna. */
  external?: boolean;
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
 * - MAIL_FAILED (solo ADMIN) → "Enviar por WhatsApp": abre wa.me al teléfono
 *   del usuario con las credenciales prellenadas (el correo no le llegó).
 * - ENROLLMENT_REQUEST (solo ADMIN) → "Ver solicitud": abre la sección de
 *   solicitudes de inscripción del panel.
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

  if (type === "MAIL_FAILED") {
    const phone = strOf(data.phone);
    const email = strOf(data.email);
    const password = strOf(data.password);
    if (!phone || !email || !password) return null;
    // Misma normalización que `WhatsAppButton`: local boliviano → +591.
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    const number = digits.startsWith("591") ? digits : `591${digits}`;
    const firstName = strOf(data.firstName);
    const loginUrl = strOf(data.loginUrl);
    const text = [
      `Hola${firstName ? ` ${firstName}` : ""}:`,
      "Se creó tu cuenta en la plataforma Certificate. Estas son tus credenciales de acceso:",
      `Correo: ${email}`,
      `Contraseña: ${password}`,
      ...(loginUrl ? [`Inicia sesión aquí: ${loginUrl}`] : []),
    ].join("\n");
    return {
      href: `https://wa.me/${number}?text=${encodeURIComponent(text)}`,
      label: "Enviar credenciales por WhatsApp",
      kind: "whatsapp",
      external: true,
    };
  }

  if (type === "ENROLLMENT_REQUEST") {
    return {
      href: "/dashboard/solicitudes",
      label: "Ver solicitud",
      kind: "activity",
    };
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
