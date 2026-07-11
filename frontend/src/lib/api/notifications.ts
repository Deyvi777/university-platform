import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

/** Tipo de notificación (espejo del enum del backend). */
export type NotificationType =
  | "ENROLLMENT"
  | "MODULE_ASSIGNMENT"
  | "ANNOUNCEMENT"
  | "GRADE"
  | "ACTIVITY_PUBLISHED"
  | "MESSAGE"
  | "MAIL_FAILED"
  | "ENROLLMENT_REQUEST";

/** Notificación tal como la entrega `GET /notifications`. */
export interface ApiNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  readAt: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Trae las notificaciones del usuario autenticado (docente/estudiante). Se llama
 * desde el layout del panel (Server Component) con el token de la sesión. Ante
 * cualquier error devuelve `[]` para que el panel nunca se rompa por esto.
 */
export async function listNotifications(): Promise<ApiNotification[]> {
  try {
    const session = await auth();
    const token = session?.accessToken;
    if (!token) return [];

    const res = await fetch(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as ApiNotification[];
  } catch {
    return [];
  }
}

/**
 * Abre una notificación por id (la marca como leída en el backend, estilo
 * Gmail). Devuelve `null` si no existe / no es del usuario (→ `notFound()` en la
 * página de detalle). No traga otros errores de forma silenciosa salvo red.
 */
export async function openNotification(
  id: string,
): Promise<ApiNotification | null> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return null;

  const res = await fetch(`${API_URL}/notifications/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as ApiNotification;
}
