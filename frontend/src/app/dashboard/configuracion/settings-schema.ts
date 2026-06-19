import { z } from "zod";
import type { AdminSettings } from "@/lib/api/admin";
import type { SettingsPayload } from "@/app/dashboard/admin-types";

// Cada campo es opcional; vacío se guarda como null (oculta el icono).
const linkField = z
  .string()
  .trim()
  .url("Debe ser una URL válida (https://…)")
  .max(2048)
  .or(z.literal(""));

export const settingsFormSchema = z.object({
  facebook: linkField,
  instagram: linkField,
  linkedin: linkField,
  youtube: linkField,
  tiktok: linkField,
  whatsapp: linkField,
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function toSettingsFormValues(
  settings?: AdminSettings,
): SettingsFormValues {
  return {
    facebook: settings?.facebook ?? "",
    instagram: settings?.instagram ?? "",
    linkedin: settings?.linkedin ?? "",
    youtube: settings?.youtube ?? "",
    tiktok: settings?.tiktok ?? "",
    whatsapp: settings?.whatsapp ?? "",
  };
}

export function toSettingsPayload(values: SettingsFormValues): SettingsPayload {
  const clean = (v: string) => (v.trim() === "" ? null : v.trim());
  return {
    facebook: clean(values.facebook),
    instagram: clean(values.instagram),
    linkedin: clean(values.linkedin),
    youtube: clean(values.youtube),
    tiktok: clean(values.tiktok),
    whatsapp: clean(values.whatsapp),
  };
}
