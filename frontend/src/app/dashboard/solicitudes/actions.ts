"use server";

import { revalidatePath } from "next/cache";
import { AdminApiError, mutateAdmin } from "@/lib/api/admin";
import { handleAdminActionError } from "@/lib/auth-guard";
import type { ActionResult } from "@/app/dashboard/admin-types";

/**
 * Convierte la solicitud en una cuenta STUDENT: el backend genera la
 * contraseña automáticamente (inicialApellidoNombre + documento) y encola el
 * correo de credenciales, igual que el alta manual de un estudiante.
 */
export async function enrollRequestAction(id: string): Promise<ActionResult> {
  try {
    await mutateAdmin("POST", `/admin/enrollment-requests/${id}/enroll`);
    revalidatePath("/dashboard/solicitudes");
    revalidatePath("/dashboard/usuarios");
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

/** Cambia el buzón que recibe el aviso por correo de cada solicitud. */
export async function updateNotifyEmailAction(
  email: string,
): Promise<ActionResult> {
  try {
    await mutateAdmin("PATCH", "/admin/settings", {
      enrollmentNotifyEmail: email,
    });
    revalidatePath("/dashboard/solicitudes");
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteRequestAction(id: string): Promise<ActionResult> {
  try {
    await mutateAdmin("DELETE", `/admin/enrollment-requests/${id}`);
    revalidatePath("/dashboard/solicitudes");
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof AdminApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Error inesperado";
}
