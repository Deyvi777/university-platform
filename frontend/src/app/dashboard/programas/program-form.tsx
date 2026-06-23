"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Controller,
  useFieldArray,
  useForm,
  type Control,
} from "react-hook-form";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AdminProgram } from "@/lib/api/admin";
import type { ProgramCategory } from "@/lib/api/programs";
import {
  createProgramAction,
  updateProgramAction,
} from "@/app/dashboard/programas/actions";
import {
  programFormSchema,
  toFormValues,
  toPayload,
  type ProgramFormValues,
} from "@/app/dashboard/programas/program-schema";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export function ProgramForm({
  program,
  categories,
}: {
  program?: AdminProgram;
  categories: ProgramCategory[];
}) {
  const router = useRouter();
  const isEdit = Boolean(program);

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: toFormValues(program),
  });
  const { register, control, handleSubmit, formState } = form;
  const { errors, isSubmitting } = formState;

  const requirements = useFieldArray({ control, name: "requirements" });
  const modules = useFieldArray({ control, name: "modules" });
  const teachers = useFieldArray({ control, name: "teachers" });

  async function onSubmit(values: ProgramFormValues) {
    const payload = toPayload(values);
    const result =
      isEdit && program
        ? await updateProgramAction(program.id, payload)
        : await createProgramAction(payload);

    if (result.ok) {
      toast.success(isEdit ? "Programa actualizado" : "Programa creado");
      router.push("/dashboard/programas");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Datos generales */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <h2 className="text-lg font-semibold">Datos generales</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Nombre del programa</Label>
            <Input id="title" {...register("title")} className="mt-1.5" />
            <FieldError message={errors.title?.message} />
          </div>

          <div>
            <Label htmlFor="categoryId">Categoría</Label>
            <select
              id="categoryId"
              {...register("categoryId")}
              className="mt-1.5 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Selecciona…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.categoryId?.message} />
          </div>

          <div>
            <Label htmlFor="slug">Slug (opcional)</Label>
            <Input
              id="slug"
              placeholder="se genera del título"
              {...register("slug")}
              className="mt-1.5"
            />
            <FieldError message={errors.slug?.message} />
          </div>

          <div className="sm:col-span-2">
            <Label>Flyer</Label>
            <div className="mt-1.5">
              <Controller
                control={control}
                name="flyerUrl"
                render={({ field }) => (
                  <ImageUploadField
                    value={field.value}
                    onChange={field.onChange}
                    folder="programs"
                    variant="flyer"
                  />
                )}
              />
            </div>
            <FieldError message={errors.flyerUrl?.message} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="objective">Objetivo del programa</Label>
            <Textarea
              id="objective"
              rows={3}
              {...register("objective")}
              className="mt-1.5"
            />
            <FieldError message={errors.objective?.message} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="targetAudience">Dirigido a</Label>
            <Textarea
              id="targetAudience"
              rows={2}
              {...register("targetAudience")}
              className="mt-1.5"
            />
            <FieldError message={errors.targetAudience?.message} />
          </div>

          <div>
            <Label htmlFor="modality">Modalidad</Label>
            <Input id="modality" {...register("modality")} className="mt-1.5" />
            <FieldError message={errors.modality?.message} />
          </div>

          <div>
            <Label htmlFor="startDate">Inicio de clases</Label>
            <Input
              id="startDate"
              type="date"
              {...register("startDate")}
              className="mt-1.5"
            />
            <FieldError message={errors.startDate?.message} />
          </div>

          <div>
            <Label htmlFor="duration">Duración</Label>
            <Input id="duration" {...register("duration")} className="mt-1.5" />
            <FieldError message={errors.duration?.message} />
          </div>

          <div>
            <Label htmlFor="schedule">Horarios</Label>
            <Input id="schedule" {...register("schedule")} className="mt-1.5" />
            <FieldError message={errors.schedule?.message} />
          </div>
        </div>
      </section>

      {/* Requisitos */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Requisitos</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => requirements.append({ value: "" })}
          >
            <Plus className="size-4" /> Agregar
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {requirements.fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="flex-1">
                <Input {...register(`requirements.${index}.value`)} />
                <FieldError
                  message={errors.requirements?.[index]?.value?.message}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => requirements.remove(index)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Malla académica */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Malla académica</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              modules.append({ name: "", contents: [{ value: "" }] })
            }
          >
            <Plus className="size-4" /> Agregar módulo
          </Button>
        </div>
        <div className="mt-4 space-y-5">
          {modules.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  Módulo {index + 1}
                </span>
                <Input
                  placeholder="Nombre del módulo"
                  {...register(`modules.${index}.name`)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => modules.remove(index)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <FieldError message={errors.modules?.[index]?.name?.message} />
              <ModuleContents control={control} register={register} moduleIndex={index} />
            </div>
          ))}
        </div>
      </section>

      {/* Plantel docente */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Plantel docente</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              teachers.append({ fullName: "", credentials: "", photoUrl: "" })
            }
          >
            <Plus className="size-4" /> Agregar docente
          </Button>
        </div>
        <div className="mt-4 space-y-4">
          {teachers.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <Label className="text-xs">Nombre completo</Label>
                <Input
                  {...register(`teachers.${index}.fullName`)}
                  className="mt-1"
                />
                <FieldError
                  message={errors.teachers?.[index]?.fullName?.message}
                />
              </div>
              <div>
                <Label className="text-xs">Grado / especialidad</Label>
                <Input
                  {...register(`teachers.${index}.credentials`)}
                  className="mt-1"
                />
                <FieldError
                  message={errors.teachers?.[index]?.credentials?.message}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => teachers.remove(index)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Inversión y publicación */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <h2 className="text-lg font-semibold">Inversión y publicación</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="currency">Moneda</Label>
            <Input id="currency" {...register("currency")} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="enrollmentFee">Matrícula</Label>
            <Input
              id="enrollmentFee"
              type="number"
              step="0.01"
              {...register("enrollmentFee", { valueAsNumber: true })}
              className="mt-1.5"
            />
            <FieldError message={errors.enrollmentFee?.message} />
          </div>
          <div>
            <Label htmlFor="totalCost">Inversión total</Label>
            <Input
              id="totalCost"
              type="number"
              step="0.01"
              {...register("totalCost", { valueAsNumber: true })}
              className="mt-1.5"
            />
            <FieldError message={errors.totalCost?.message} />
          </div>
          <div className="sm:col-span-3">
            <Label htmlFor="paymentFacilities">
              Facilidades de pago (opcional)
            </Label>
            <Textarea
              id="paymentFacilities"
              rows={2}
              {...register("paymentFacilities")}
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-3 flex items-center gap-3">
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
            <Label htmlFor="isPublished">
              Publicado (visible en la landing)
            </Label>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Guardar cambios" : "Crear programa"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/programas")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ModuleContents({
  control,
  register,
  moduleIndex,
}: {
  control: Control<ProgramFormValues>;
  register: ReturnType<typeof useForm<ProgramFormValues>>["register"];
  moduleIndex: number;
}) {
  const contents = useFieldArray({
    control,
    name: `modules.${moduleIndex}.contents`,
  });

  return (
    <div className="mt-3 space-y-2 border-l-2 border-muted pl-4">
      <Label className="text-xs text-muted-foreground">
        Contenidos / asignaturas
      </Label>
      {contents.fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <Input
            {...register(`modules.${moduleIndex}.contents.${index}.value`)}
            className="h-8"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => contents.remove(index)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => contents.append({ value: "" })}
      >
        <Plus className="size-4" /> Agregar contenido
      </Button>
    </div>
  );
}
