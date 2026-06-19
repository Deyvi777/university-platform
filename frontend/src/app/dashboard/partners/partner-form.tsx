"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AdminPartner } from "@/lib/api/admin";
import {
  createPartnerAction,
  updatePartnerAction,
} from "@/app/dashboard/partners/actions";
import {
  partnerFormSchema,
  toPartnerFormValues,
  toPartnerPayload,
  type PartnerFormValues,
} from "@/app/dashboard/partners/partner-schema";

export function PartnerForm({ partner }: { partner?: AdminPartner }) {
  const router = useRouter();
  const isEdit = Boolean(partner);

  const { register, control, handleSubmit, formState } =
    useForm<PartnerFormValues>({
      resolver: zodResolver(partnerFormSchema),
      defaultValues: toPartnerFormValues(partner),
    });
  const { errors, isSubmitting } = formState;

  async function onSubmit(values: PartnerFormValues) {
    const payload = toPartnerPayload(values);
    const result =
      isEdit && partner
        ? await updatePartnerAction(partner.id, payload)
        : await createPartnerAction(payload);

    if (result.ok) {
      toast.success(isEdit ? "Institución actualizada" : "Institución creada");
      router.push("/dashboard/partners");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl space-y-6 rounded-xl border bg-card p-6"
    >
      <div>
        <Label>Logo</Label>
        <div className="mt-1.5">
          <Controller
            control={control}
            name="logoUrl"
            render={({ field }) => (
              <ImageUploadField
                value={field.value}
                onChange={field.onChange}
                folder="partners"
                variant="logo"
              />
            )}
          />
        </div>
        {errors.logoUrl && (
          <p className="mt-1 text-xs text-destructive">
            {errors.logoUrl.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="name">Nombre de la institución</Label>
        <Input id="name" {...register("name")} className="mt-1.5" />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="displayOrder">Orden de aparición</Label>
        <Input
          id="displayOrder"
          type="number"
          {...register("displayOrder", { valueAsNumber: true })}
          className="mt-1.5 max-w-32"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Menor número aparece primero.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="isPublished"
          render={({ field }) => (
            <Switch
              id="isPublished"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="isPublished">Publicado (visible en la landing)</Label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Guardar cambios" : "Crear institución"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/partners")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
