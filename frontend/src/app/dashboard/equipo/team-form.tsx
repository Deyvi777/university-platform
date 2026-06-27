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
import type { AdminTeamMember } from "@/lib/api/admin";
import {
  createTeamMemberAction,
  updateTeamMemberAction,
} from "@/app/dashboard/equipo/actions";
import {
  teamMemberFormSchema,
  toTeamMemberFormValues,
  toTeamMemberPayload,
  type TeamMemberFormValues,
} from "@/app/dashboard/equipo/team-schema";

export function TeamMemberForm({
  member,
  variant = "page",
  onSuccess,
  onCancel,
}: {
  member?: AdminTeamMember;
  /** "page" envuelve el form en una tarjeta; "dialog" lo deja sin chrome. */
  variant?: "page" | "dialog";
  /** Si se pasa, se llama tras crear/editar (en vez de navegar). */
  onSuccess?: () => void;
  /** Si se pasa, lo invoca el botón Cancelar (en vez de navegar). */
  onCancel?: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(member);

  const { register, control, handleSubmit, formState } =
    useForm<TeamMemberFormValues>({
      resolver: zodResolver(teamMemberFormSchema),
      defaultValues: toTeamMemberFormValues(member),
    });
  const { errors, isSubmitting } = formState;

  async function onSubmit(values: TeamMemberFormValues) {
    const payload = toTeamMemberPayload(values);
    const result =
      isEdit && member
        ? await updateTeamMemberAction(member.id, payload)
        : await createTeamMemberAction(payload);

    if (result.ok) {
      toast.success(isEdit ? "Integrante actualizado" : "Integrante creado");
      router.refresh();
      if (onSuccess) onSuccess();
      else router.push("/dashboard/equipo");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={
        variant === "dialog"
          ? "space-y-6"
          : "max-w-xl space-y-6 rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none"
      }
    >
      <div>
        <Label>Fotografía</Label>
        <div className="mt-1.5">
          <Controller
            control={control}
            name="photoUrl"
            render={({ field }) => (
              <ImageUploadField
                value={field.value}
                onChange={field.onChange}
                folder="team"
                variant="portrait"
              />
            )}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Preferentemente sin fondo (PNG o WEBP transparente), de cuerpo o medio
          cuerpo. Máximo 5 MB.
        </p>
        {errors.photoUrl && (
          <p className="mt-1 text-xs text-destructive">
            {errors.photoUrl.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          {...register("name")}
          className="mt-1.5"
          placeholder="MS.C. Veronica Montoya"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="role">Cargo</Label>
        <Input
          id="role"
          {...register("role")}
          className="mt-1.5"
          placeholder="Gerente General / Representante Legal"
        />
        {errors.role && (
          <p className="mt-1 text-xs text-destructive">{errors.role.message}</p>
        )}
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
        <Label htmlFor="isPublished">Activo (visible en la landing)</Label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Guardar cambios" : "Crear integrante"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() =>
            onCancel ? onCancel() : router.push("/dashboard/equipo")
          }
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
