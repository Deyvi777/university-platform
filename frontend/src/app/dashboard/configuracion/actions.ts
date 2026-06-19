"use server";

import { revalidatePath } from "next/cache";
import { AdminApiError, mutateAdmin, type AdminSettings } from "@/lib/api/admin";
import { handleAdminActionError } from "@/lib/auth-guard";
import type { ActionResult, SettingsPayload } from "@/app/dashboard/admin-types";

export async function updateSettingsAction(
  payload: SettingsPayload,
): Promise<ActionResult> {
  try {
    await mutateAdmin<AdminSettings>("PATCH", "/admin/settings", payload);
    revalidatePath("/"); // el footer de la landing depende de estos enlaces
    revalidatePath("/dashboard/configuracion");
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
