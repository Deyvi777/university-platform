import { z } from "zod";
import type { AdminPartner } from "@/lib/api/admin";
import type { PartnerPayload } from "@/app/dashboard/admin-types";

export const partnerFormSchema = z.object({
  name: z.string().min(1, "Requerido"),
  logoUrl: z.string().min(1, "Sube un logo"),
  displayOrder: z.number().int().min(0),
  isPublished: z.boolean(),
});

export type PartnerFormValues = z.infer<typeof partnerFormSchema>;

export function toPartnerFormValues(partner?: AdminPartner): PartnerFormValues {
  return {
    name: partner?.name ?? "",
    logoUrl: partner?.logoUrl ?? "",
    displayOrder: partner?.displayOrder ?? 0,
    isPublished: partner?.isPublished ?? true,
  };
}

export function toPartnerPayload(values: PartnerFormValues): PartnerPayload {
  return {
    name: values.name.trim(),
    logoUrl: values.logoUrl,
    displayOrder: values.displayOrder,
    isPublished: values.isPublished,
  };
}
