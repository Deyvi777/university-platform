"use server";

import { revalidatePath } from "next/cache";
import {
  AdminApiError,
  mutateAdmin,
  type AdminTeamMember,
} from "@/lib/api/admin";
import { handleAdminActionError } from "@/lib/auth-guard";
import type {
  ActionResult,
  TeamMemberPayload,
} from "@/app/dashboard/admin-types";

function revalidateTeam() {
  revalidatePath("/");
  revalidatePath("/nosotros");
  revalidatePath("/dashboard/equipo");
}

export async function createTeamMemberAction(
  payload: TeamMemberPayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const member = await mutateAdmin<AdminTeamMember>(
      "POST",
      "/admin/team",
      payload,
    );
    revalidateTeam();
    return { ok: true, data: { id: member.id } };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updateTeamMemberAction(
  id: string,
  payload: TeamMemberPayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const member = await mutateAdmin<AdminTeamMember>(
      "PATCH",
      `/admin/team/${id}`,
      payload,
    );
    revalidateTeam();
    return { ok: true, data: { id: member.id } };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function reorderTeamAction(
  orderedIds: string[],
): Promise<ActionResult> {
  try {
    await mutateAdmin("PUT", "/admin/team/reorder", { orderedIds });
    revalidateTeam();
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteTeamMemberAction(id: string): Promise<ActionResult> {
  try {
    await mutateAdmin("DELETE", `/admin/team/${id}`);
    revalidateTeam();
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
