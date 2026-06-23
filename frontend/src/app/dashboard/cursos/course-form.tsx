"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  GraduationCap,
  Info,
  Layers,
  Loader2,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCourse } from "@/lib/api/admin";
import {
  createCourseAction,
  updateCourseAction,
} from "@/app/dashboard/cursos/actions";
import {
  courseFormSchema,
  toFormValues,
  toPayload,
  type CourseFormValues,
} from "@/app/dashboard/cursos/course-schema";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Borrador" },
  { value: "ACTIVE", label: "Activo" },
  { value: "FINISHED", label: "Finalizado" },
  { value: "ARCHIVED", label: "Archivado" },
] as const;

/** Tarjeta de sección: encabezado con icono + título + descripción y su contenido. */
function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Info;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
      <header className="flex items-start gap-3 border-b p-5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-300"
          aria-hidden="true"
        >
          <Icon className="size-4.5" />
        </span>
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

export function CourseForm({ course }: { course?: AdminCourse }) {
  const router = useRouter();
  const isEdit = Boolean(course);
  const [formError, setFormError] = useState<string | null>(null);

  const { register, control, handleSubmit, formState } =
    useForm<CourseFormValues>({
      resolver: zodResolver(courseFormSchema),
      defaultValues: toFormValues(course),
    });
  const { errors, isSubmitting } = formState;
  const modules = useFieldArray({ control, name: "modules" });

  async function onSubmit(values: CourseFormValues) {
    setFormError(null);
    const result =
      isEdit && course
        ? await updateCourseAction(course.id, toPayload(values))
        : await createCourseAction(toPayload(values));

    if (result.ok) {
      toast.success(isEdit ? "Programa actualizado" : "Programa creado");
      // Tras crear, vamos al detalle para asignar docentes e inscribir estudiantes.
      router.push(`/dashboard/cursos/${result.data.id}`);
      router.refresh();
      return;
    }

    setFormError(result.error);
    toast.error(result.error);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="max-w-3xl space-y-6"
    >
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      {/* Información general ------------------------------------------------ */}
      <FormSection
        icon={Info}
        title="Información general"
        description="Identifica el programa académico."
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre del programa</Label>
          <Input
            id="name"
            placeholder="Maestría en Gestión Pública 2026"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="code">
            Código
            <span className="ml-2 font-normal text-muted-foreground">
              (opcional)
            </span>
          </Label>
          <Input
            id="code"
            placeholder="MGP-2026-I"
            aria-invalid={errors.code ? true : undefined}
            aria-describedby={errors.code ? "code-error" : "code-help"}
            {...register("code")}
          />
          {errors.code ? (
            <p id="code-error" className="text-xs text-destructive">
              {errors.code.message}
            </p>
          ) : (
            <p id="code-help" className="text-xs text-muted-foreground">
              Si lo dejas vacío, se genera a partir del nombre.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">
            Descripción
            <span className="ml-2 font-normal text-muted-foreground">
              (opcional)
            </span>
          </Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="Breve descripción del programa, su enfoque y a quién está dirigido."
            {...register("description")}
          />
        </div>
      </FormSection>

      {/* Configuración ----------------------------------------------------- */}
      <FormSection
        icon={SlidersHorizontal}
        title="Configuración"
        description="Estado de publicación, modalidad, calendario y nota mínima."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="status">Estado</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  items={STATUS_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              «Activo» publica el programa en el sitio público.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="modality">
              Modalidad
              <span className="ml-2 font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <Input
              id="modality"
              placeholder="Virtual con clases en vivo"
              {...register("modality")}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="startDate">
              Fecha de inicio
              <span className="ml-2 font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <Input id="startDate" type="date" {...register("startDate")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endDate">
              Fecha de fin
              <span className="ml-2 font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <Input id="endDate" type="date" {...register("endDate")} />
          </div>
        </div>

        <div className="space-y-1.5 sm:max-w-[50%] sm:pr-2.5">
          <Label htmlFor="passingScore">Nota mínima de aprobación</Label>
          <Input
            id="passingScore"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.01"
            className="tabular-nums"
            aria-invalid={errors.passingScore ? true : undefined}
            aria-describedby={
              errors.passingScore ? "passingScore-error" : "passingScore-help"
            }
            {...register("passingScore", { valueAsNumber: true })}
          />
          {errors.passingScore ? (
            <p id="passingScore-error" className="text-xs text-destructive">
              {errors.passingScore.message}
            </p>
          ) : (
            <p id="passingScore-help" className="text-xs text-muted-foreground">
              Sobre 100. Aplica a las notas del kardex.
            </p>
          )}
        </div>
      </FormSection>

      {/* Módulos ----------------------------------------------------------- */}
      <FormSection
        icon={Layers}
        title="Módulos"
        description="Define la malla del programa. Podrás asignar docentes a cada módulo después de crearlo."
      >
        {errors.modules?.root && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="size-3.5" aria-hidden="true" />
            {errors.modules.root.message}
          </p>
        )}

        {modules.fields.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-6 py-8 text-center">
            <GraduationCap
              className="size-6 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              Aún no hay módulos. Agrega el primero para armar la malla.
            </p>
          </div>
        ) : (
          <ol className="space-y-2.5">
            {modules.fields.map((field, index) => (
              <li
                key={field.id}
                className="flex items-start gap-3 rounded-lg border bg-background p-3"
              >
                <span
                  className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <Input
                    placeholder={`Nombre del módulo ${index + 1}`}
                    aria-label={`Nombre del módulo ${index + 1}`}
                    aria-invalid={
                      errors.modules?.[index]?.name ? true : undefined
                    }
                    {...register(`modules.${index}.name` as const)}
                  />
                  {errors.modules?.[index]?.name && (
                    <p className="text-xs text-destructive">
                      {errors.modules[index]?.name?.message}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mt-0.5 text-muted-foreground hover:text-destructive"
                  aria-label={`Quitar módulo ${index + 1}`}
                  disabled={modules.fields.length === 1}
                  onClick={() => modules.remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ol>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => modules.append({ name: "" })}
        >
          <Plus className="size-4" /> Agregar módulo
        </Button>
      </FormSection>

      {/* Acciones ---------------------------------------------------------- */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Guardar cambios" : "Crear programa"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() =>
            router.push(
              isEdit && course
                ? `/dashboard/cursos/${course.id}`
                : "/dashboard/cursos",
            )
          }
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
