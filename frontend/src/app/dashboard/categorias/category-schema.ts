import { z } from "zod";
import type { AdminCategory } from "@/lib/api/admin";
import type { CategoryPayload } from "@/app/dashboard/admin-types";

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Requerido"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Solo minúsculas, números y guiones")
    .optional(),
  isActive: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function toCategoryFormValues(
  category?: AdminCategory,
): CategoryFormValues {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    isActive: category?.isActive ?? true,
  };
}

export function toCategoryPayload(values: CategoryFormValues): CategoryPayload {
  // `displayOrder` ya no se edita en el form: el orden se cambia con
  // drag-and-drop en la tabla. Al crear, el backend lo agrega al final.
  return {
    name: values.name.trim(),
    slug: values.slug?.trim() || undefined,
    isActive: values.isActive,
  };
}
