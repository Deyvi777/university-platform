import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

/** Un contacto de chat dentro de un módulo (el "otro" rol) + no leídos. */
export interface ChatContact {
  id: string;
  firstName: string;
  lastName: string;
  unread: number;
}

/** Un mensaje de chat tal como lo entrega el backend / el gateway WS. */
export interface ChatMessage {
  id: string;
  moduleId: string;
  studentId: string;
  teacherId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

/**
 * Contactos del módulo para el usuario autenticado: docentes (si es estudiante)
 * o estudiantes inscritos (si es docente/admin), con su conteo de no leídos.
 * Ante cualquier error devuelve `[]` para que la vista nunca se rompa.
 */
export async function getChatContacts(
  moduleId: string,
): Promise<ChatContact[]> {
  try {
    const session = await auth();
    const token = session?.accessToken;
    if (!token) return [];

    const res = await fetch(
      `${API_URL}/me/chat/${encodeURIComponent(moduleId)}/contacts`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) return [];
    return (await res.json()) as ChatContact[];
  } catch {
    return [];
  }
}
