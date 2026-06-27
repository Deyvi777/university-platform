"use server";

import { revalidatePath } from "next/cache";
import { AdminApiError, mutateAdmin, type AdminPartner } from "@/lib/api/admin";
import { handleAdminActionError } from "@/lib/auth-guard";
import type { ActionResult, PartnerPayload } from "@/app/dashboard/admin-types";

function revalidatePartners() {
  revalidatePath("/");
  revalidatePath("/dashboard/partners");
}

export async function createPartnerAction(
  payload: PartnerPayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const partner = await mutateAdmin<AdminPartner>(
      "POST",
      "/admin/partners",
      payload,
    );
    revalidatePartners();
    return { ok: true, data: { id: partner.id } };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updatePartnerAction(
  id: string,
  payload: PartnerPayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const partner = await mutateAdmin<AdminPartner>(
      "PATCH",
      `/admin/partners/${id}`,
      payload,
    );
    revalidatePartners();
    return { ok: true, data: { id: partner.id } };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function reorderPartnersAction(
  orderedIds: string[],
): Promise<ActionResult> {
  try {
    await mutateAdmin("PUT", "/admin/partners/reorder", { orderedIds });
    revalidatePartners();
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deletePartnerAction(id: string): Promise<ActionResult> {
  try {
    await mutateAdmin("DELETE", `/admin/partners/${id}`);
    revalidatePartners();
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
