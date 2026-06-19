"use server";

import { revalidatePath } from "next/cache";
import { AdminApiError, mutateAdmin, type AdminProgram } from "@/lib/api/admin";
import { handleAdminActionError } from "@/lib/auth-guard";
import type { ActionResult, ProgramPayload } from "@/app/dashboard/admin-types";

function revalidatePrograms() {
  revalidatePath("/");
  revalidatePath("/programas/[slug]", "page");
  revalidatePath("/dashboard/programas");
}

export async function createProgramAction(
  payload: ProgramPayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const program = await mutateAdmin<AdminProgram>(
      "POST",
      "/admin/programs",
      payload,
    );
    revalidatePrograms();
    return { ok: true, data: { id: program.id } };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updateProgramAction(
  id: string,
  payload: ProgramPayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const program = await mutateAdmin<AdminProgram>(
      "PATCH",
      `/admin/programs/${id}`,
      payload,
    );
    revalidatePrograms();
    return { ok: true, data: { id: program.id } };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteProgramAction(id: string): Promise<ActionResult> {
  try {
    await mutateAdmin("DELETE", `/admin/programs/${id}`);
    revalidatePrograms();
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
