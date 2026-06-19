import { z } from "zod";
import type { AdminCategory } from "@/lib/api/admin";
import type { CategoryPayload } from "@/app/dashboard/admin-types";

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Requerido"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Solo minúsculas, números y guiones")
    .optional(),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function toCategoryFormValues(
  category?: AdminCategory,
): CategoryFormValues {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    displayOrder: category?.displayOrder ?? 0,
    isActive: category?.isActive ?? true,
  };
}

export function toCategoryPayload(values: CategoryFormValues): CategoryPayload {
  return {
    name: values.name.trim(),
    slug: values.slug?.trim() || undefined,
    displayOrder: values.displayOrder,
    isActive: values.isActive,
  };
}
