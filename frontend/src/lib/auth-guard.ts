import { redirect, unstable_rethrow } from "next/navigation";
import { auth } from "@/auth";
import type { Session } from "next-auth";

/**
 * Garantiza que haya un usuario ADMIN autenticado.
 * - Sin sesión → /login
 * - Sesión sin rol ADMIN → / (sin acceso al panel de gestión)
 */
export async function requireAdmin(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }
  return session;
}

/**
 * Garantiza que haya un usuario autenticado (cualquier rol: ADMIN, PROFESSOR o
 * STUDENT) — sin sesión → /login. NO restringe por rol: úsalo en pantallas
 * compartidas del panel (p. ej. la home `/dashboard`, que ramifica la UI según
 * `session.user.role`). Las secciones exclusivas de ADMIN siguen llamando a
 * `requireAdmin()`.
 */
export async function requireUser(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * A llamar al INICIO del catch de toda server action admin, antes de mapear el
 * error a un `ActionResult`.
 *
 * Re-lanza el control de flujo de Next (`NEXT_REDIRECT` / `NEXT_NOT_FOUND`) vía
 * `unstable_rethrow`. Es necesario porque, ante un 401 (sesión muerta: el token
 * de NextAuth ya no sirve contra el backend), `parse()` (src/lib/api/admin.ts)
 * lanza `redirect("/api/auth/session-expired")` → un NEXT_REDIRECT. Sin este
 * rethrow, el catch de la action lo atraparía y lo convertiría en un
 * `{ ok: false, error }` (toast genérico) en vez de redirigir, dejando al admin
 * atascado en una sesión muerta.
 *
 * No hay bucle de redirección: el Route Handler /api/auth/session-expired CIERRA
 * la sesión (borra la cookie) antes de llevar a /login?expired=1, así que el
 * login ya no rebota a /dashboard. Redirigir directo a /login sí provocaba el
 * bucle, porque la sesión seguía "válida". Ver src/lib/api/admin.ts.
 */
export function handleAdminActionError(error: unknown): void {
  unstable_rethrow(error);
}
