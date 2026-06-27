"use server";

import { revalidatePath } from "next/cache";
import { AdminApiError, mutateAdmin, type AdminUser } from "@/lib/api/admin";
import { handleAdminActionError } from "@/lib/auth-guard";
import type {
  ActionResult,
  BulkUploadResult,
  UserPayload,
} from "@/app/dashboard/admin-types";

function revalidateUsers() {
  // La home admin muestra el conteo de usuarios, así que también se revalida.
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/usuarios");
}

export async function createUserAction(
  payload: UserPayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await mutateAdmin<AdminUser>("POST", "/admin/users", payload);
    revalidateUsers();
    return { ok: true, data: { id: user.id } };
  } catch (error) {
    handleAdminActionError(error); // 401 → cierra sesión muerta; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updateUserAction(
  id: string,
  payload: UserPayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await mutateAdmin<AdminUser>(
      "PATCH",
      `/admin/users/${id}`,
      payload,
    );
    revalidateUsers();
    return { ok: true, data: { id: user.id } };
  } catch (error) {
    handleAdminActionError(error); // 401 → cierra sesión muerta; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

/**
 * Carga masiva de estudiantes (carga parcial). Recibe las filas ya parseadas
 * del Excel en el cliente y las envía al backend, que valida y crea las válidas
 * y reporta las que fallan.
 */
export async function bulkCreateStudentsAction(
  students: Record<string, string>[],
): Promise<ActionResult<BulkUploadResult>> {
  try {
    const result = await mutateAdmin<BulkUploadResult>(
      "POST",
      "/admin/users/bulk",
      { students },
    );
    revalidateUsers();
    return { ok: true, data: result };
  } catch (error) {
    handleAdminActionError(error); // 401 → cierra sesión muerta; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  try {
    await mutateAdmin("DELETE", `/admin/users/${id}`);
    revalidateUsers();
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error); // 401 → cierra sesión muerta; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

/**
 * Mensaje de error orientado al usuario. El backend devuelve 409 con un mensaje
 * para correo duplicado; `AdminApiError` ya conserva ese texto, así que lo
 * mostramos tal cual en el formulario / toast en vez de un crash.
 */
function errorMessage(error: unknown): string {
  if (error instanceof AdminApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Error inesperado";
}
