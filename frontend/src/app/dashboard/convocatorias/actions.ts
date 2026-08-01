"use server";

import { revalidatePath } from "next/cache";
import { AdminApiError, mutateAdmin, type AdminCall } from "@/lib/api/admin";
import { handleAdminActionError } from "@/lib/auth-guard";
import type { ActionResult, CallPayload } from "@/app/dashboard/admin-types";

function revalidateCalls() {
  revalidatePath("/convocatorias");
  revalidatePath("/convocatorias/[slug]", "page");
  revalidatePath("/dashboard/convocatorias");
}

export async function createCallAction(
  payload: CallPayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const call = await mutateAdmin<AdminCall>("POST", "/admin/calls", payload);
    revalidateCalls();
    return { ok: true, data: { id: call.id } };
  } catch (error) {
    handleAdminActionError(error);
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updateCallAction(
  id: string,
  payload: CallPayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const call = await mutateAdmin<AdminCall>(
      "PATCH",
      `/admin/calls/${id}`,
      payload,
    );
    revalidateCalls();
    return { ok: true, data: { id: call.id } };
  } catch (error) {
    handleAdminActionError(error);
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteCallAction(id: string): Promise<ActionResult> {
  try {
    await mutateAdmin("DELETE", `/admin/calls/${id}`);
    revalidateCalls();
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error);
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteCallApplicationAction(
  callId: string,
  applicationId: string,
): Promise<ActionResult> {
  try {
    await mutateAdmin(
      "DELETE",
      `/admin/calls/${callId}/applications/${applicationId}`,
    );
    revalidatePath(`/dashboard/convocatorias/${callId}/postulaciones`);
    revalidatePath("/dashboard/convocatorias");
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error);
    return { ok: false, error: errorMessage(error) };
  }
}

/** Cambia el buzón que recibe el aviso de cada nueva postulación. */
export async function updateCallNotifyEmailAction(
  email: string,
): Promise<ActionResult> {
  try {
    await mutateAdmin("PATCH", "/admin/settings", {
      callApplicationNotifyEmail: email,
    });
    revalidatePath("/dashboard/convocatorias");
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error);
    return { ok: false, error: errorMessage(error) };
  }
}

function errorMessage(error: unknown) {
  if (error instanceof AdminApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Error inesperado";
}
