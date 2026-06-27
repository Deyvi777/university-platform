import { z } from "zod";
import type { AdminPartner } from "@/lib/api/admin";
import type { PartnerPayload } from "@/app/dashboard/admin-types";

export const partnerFormSchema = z.object({
  name: z.string().min(1, "Requerido"),
  logoUrl: z.string().min(1, "Sube un logo"),
  isPublished: z.boolean(),
});

export type PartnerFormValues = z.infer<typeof partnerFormSchema>;

export function toPartnerFormValues(partner?: AdminPartner): PartnerFormValues {
  return {
    name: partner?.name ?? "",
    logoUrl: partner?.logoUrl ?? "",
    isPublished: partner?.isPublished ?? true,
  };
}

export function toPartnerPayload(values: PartnerFormValues): PartnerPayload {
  // `displayOrder` ya no se edita en el form: el orden se cambia con
  // drag-and-drop en la tabla. Al crear, el backend lo agrega al final.
  return {
    name: values.name.trim(),
    logoUrl: values.logoUrl,
    isPublished: values.isPublished,
  };
}
