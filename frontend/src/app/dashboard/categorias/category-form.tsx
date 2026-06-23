"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AdminCategory } from "@/lib/api/admin";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/app/dashboard/categorias/actions";
import {
  categoryFormSchema,
  toCategoryFormValues,
  toCategoryPayload,
  type CategoryFormValues,
} from "@/app/dashboard/categorias/category-schema";

export function CategoryForm({ category }: { category?: AdminCategory }) {
  const router = useRouter();
  const isEdit = Boolean(category);

  const { register, control, handleSubmit, formState } =
    useForm<CategoryFormValues>({
      resolver: zodResolver(categoryFormSchema),
      defaultValues: toCategoryFormValues(category),
    });
  const { errors, isSubmitting } = formState;

  async function onSubmit(values: CategoryFormValues) {
    const payload = toCategoryPayload(values);
    const result =
      isEdit && category
        ? await updateCategoryAction(category.id, payload)
        : await createCategoryAction(payload);

    if (result.ok) {
      toast.success(isEdit ? "Categoría actualizada" : "Categoría creada");
      router.push("/dashboard/categorias");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl space-y-6 rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none"
    >
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" {...register("name")} className="mt-1.5" />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="slug">Slug (opcional)</Label>
        <Input
          id="slug"
          placeholder="se genera del nombre"
          {...register("slug")}
          className="mt-1.5"
        />
        {errors.slug && (
          <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Identificador usado en el filtro de la landing (ej. maestria).
        </p>
      </div>

      <div>
        <Label htmlFor="displayOrder">Orden de aparición</Label>
        <Input
          id="displayOrder"
          type="number"
          {...register("displayOrder", { valueAsNumber: true })}
          className="mt-1.5 max-w-32"
        />
      </div>

      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Switch
              id="isActive"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="isActive">Activa (visible como filtro en la landing)</Label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Guardar cambios" : "Crear categoría"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/categorias")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
