"use server";

import { revalidatePath } from "next/cache";
import { AdminApiError, mutateAdmin, type AdminCategory } from "@/lib/api/admin";
import { handleAdminActionError } from "@/lib/auth-guard";
import type { ActionResult, CategoryPayload } from "@/app/dashboard/admin-types";

function revalidateCategories() {
  revalidatePath("/"); // las pestañas de la landing dependen de las categorías
  revalidatePath("/dashboard/categorias");
  revalidatePath("/dashboard/programas");
}

export async function createCategoryAction(
  payload: CategoryPayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const category = await mutateAdmin<AdminCategory>(
      "POST",
      "/admin/categories",
      payload,
    );
    revalidateCategories();
    return { ok: true, data: { id: category.id } };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updateCategoryAction(
  id: string,
  payload: CategoryPayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const category = await mutateAdmin<AdminCategory>(
      "PATCH",
      `/admin/categories/${id}`,
      payload,
    );
    revalidateCategories();
    return { ok: true, data: { id: category.id } };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    await mutateAdmin("DELETE", `/admin/categories/${id}`);
    revalidateCategories();
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
