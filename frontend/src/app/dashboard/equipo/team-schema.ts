import { z } from "zod";
import type { AdminTeamMember } from "@/lib/api/admin";
import type { TeamMemberPayload } from "@/app/dashboard/admin-types";

export const teamMemberFormSchema = z.object({
  name: z.string().min(1, "Requerido"),
  role: z.string().min(1, "Requerido"),
  photoUrl: z.string().min(1, "Sube una fotografía"),
  isPublished: z.boolean(),
});

export type TeamMemberFormValues = z.infer<typeof teamMemberFormSchema>;

export function toTeamMemberFormValues(
  member?: AdminTeamMember,
): TeamMemberFormValues {
  return {
    name: member?.name ?? "",
    role: member?.role ?? "",
    photoUrl: member?.photoUrl ?? "",
    isPublished: member?.isPublished ?? true,
  };
}

export function toTeamMemberPayload(
  values: TeamMemberFormValues,
): TeamMemberPayload {
  return {
    name: values.name.trim(),
    role: values.role.trim(),
    photoUrl: values.photoUrl,
    isPublished: values.isPublished,
  };
}
