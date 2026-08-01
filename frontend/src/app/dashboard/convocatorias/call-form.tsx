"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
} from "react-hook-form";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCall } from "@/lib/api/admin";
import { createCallAction, updateCallAction } from "./actions";
import {
  callFormSchema,
  toCallFormValues,
  toCallPayload,
  type CallFormValues,
} from "./call-schema";

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-xs text-destructive">{message}</p>
  ) : null;
}

const TYPE_LABELS = {
  SINGLE_CHOICE: "Selección única",
  MULTIPLE_CHOICE: "Selección múltiple",
  TEXT: "Complementación / respuesta abierta",
  FILE: "Archivo adjunto",
} as const;

export function CallForm({ call }: { call?: AdminCall }) {
  const router = useRouter();
  const form = useForm<CallFormValues>({
    resolver: zodResolver(callFormSchema),
    defaultValues: toCallFormValues(call),
  });
  const { register, control, handleSubmit, formState } = form;
  const questions = useFieldArray({
    control,
    name: "questions",
    keyName: "_formKey",
  });

  async function onSubmit(values: CallFormValues) {
    const payload = toCallPayload(values);
    const result = call
      ? await updateCallAction(call.id, payload)
      : await createCallAction(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(call ? "Convocatoria actualizada" : "Convocatoria creada");
    router.push("/dashboard/convocatorias");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <h2 className="text-lg font-semibold">Información pública</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define cómo aparecerá la convocatoria en la página pública.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              className="mt-1.5"
              {...register("title")}
              aria-invalid={Boolean(formState.errors.title)}
            />
            <FieldError message={formState.errors.title?.message} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="summary">Resumen</Label>
            <Textarea
              id="summary"
              rows={3}
              className="mt-1.5"
              {...register("summary")}
              aria-invalid={Boolean(formState.errors.summary)}
            />
            <FieldError message={formState.errors.summary?.message} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">
              Descripción e instrucciones{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <Textarea
              id="description"
              rows={6}
              className="mt-1.5"
              {...register("description")}
            />
          </div>
          <div>
            <Label htmlFor="slug">
              Slug{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <Input
              id="slug"
              className="mt-1.5"
              placeholder="se-genera-del-titulo"
              {...register("slug")}
            />
            <FieldError message={formState.errors.slug?.message} />
          </div>
          <div className="sm:col-span-2">
            <Label>
              Imagen de portada{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <div className="mt-1.5">
              <Controller
                control={control}
                name="coverUrl"
                render={({ field }) => (
                  <ImageUploadField
                    value={field.value}
                    onChange={field.onChange}
                    folder="calls"
                    variant="landscape"
                  />
                )}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <h2 className="text-lg font-semibold">Publicación y vigencia</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="opensAt">
              Inicio de recepción{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <Input
              id="opensAt"
              type="datetime-local"
              className="mt-1.5"
              {...register("opensAt")}
            />
          </div>
          <div>
            <Label htmlFor="closesAt">
              Cierre de recepción{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <Input
              id="closesAt"
              type="datetime-local"
              className="mt-1.5"
              {...register("closesAt")}
            />
            <FieldError message={formState.errors.closesAt?.message} />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between rounded-xl border bg-background p-4">
            <div>
              <Label htmlFor="isPublished">Publicar convocatoria</Label>
              <p className="text-sm text-muted-foreground">
                Visible en la página pública; las fechas controlan si recibe
                postulaciones.
              </p>
            </div>
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
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Formulario de postulación</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Agrega y ordena las preguntas que responderán los postulantes.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              questions.append({
                type: "TEXT",
                prompt: "",
                description: "",
                required: true,
                options: [],
              })
            }
          >
            <Plus className="size-4" /> Agregar pregunta
          </Button>
        </div>
        {call && call._count.applications > 0 && (
          <p className="mt-4 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-sm text-sky-700 dark:text-sky-300">
            Esta convocatoria ya tiene {call._count.applications}{" "}
            {call._count.applications === 1 ? "postulación" : "postulaciones"}.
            Puedes modificar el formulario: los cambios se aplicarán a nuevas
            postulaciones y las respuestas anteriores conservarán las preguntas
            originales.
          </p>
        )}
        <div className="mt-6 space-y-4">
          {questions.fields.map((question, index) => (
            <QuestionEditor
              key={question._formKey}
              index={index}
              control={control}
              register={register}
              disabled={false}
              error={formState.errors.questions?.[index]}
              onRemove={() => questions.remove(index)}
              onUp={() => questions.move(index, index - 1)}
              onDown={() => questions.move(index, index + 1)}
              first={index === 0}
              last={index === questions.fields.length - 1}
            />
          ))}
          <FieldError message={formState.errors.questions?.message} />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/convocatorias")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {call ? "Guardar cambios" : "Crear convocatoria"}
        </Button>
      </div>
    </form>
  );
}

function QuestionEditor({
  index,
  control,
  register,
  disabled,
  error,
  onRemove,
  onUp,
  onDown,
  first,
  last,
}: {
  index: number;
  control: Control<CallFormValues>;
  register: ReturnType<typeof useForm<CallFormValues>>["register"];
  disabled: boolean;
  error:
    | NonNullable<
        ReturnType<
          typeof useForm<CallFormValues>
        >["formState"]["errors"]["questions"]
      >[number]
    | undefined;
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
  first: boolean;
  last: boolean;
}) {
  const options = useFieldArray({
    control,
    name: `questions.${index}.options`,
  });
  const type = useWatch({ control, name: `questions.${index}.type` });
  const selection = type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";

  return (
    <div className="rounded-2xl border bg-background p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <GripVertical className="size-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Pregunta {index + 1}</span>
        {!disabled && (
          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={first}
              onClick={onUp}
              aria-label="Subir pregunta"
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={last}
              onClick={onDown}
              aria-label="Bajar pregunta"
            >
              <ChevronDown className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={onRemove}
              aria-label="Eliminar pregunta"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Tipo</Label>
          <Controller
            control={control}
            name={`questions.${index}.type`}
            render={({ field }) => (
              <select
                value={field.value}
                disabled={disabled}
                onChange={(event) => {
                  const value = event.target
                    .value as CallFormValues["questions"][number]["type"];
                  field.onChange(value);
                  const isSelection =
                    value === "SINGLE_CHOICE" || value === "MULTIPLE_CHOICE";
                  if (!isSelection) options.replace([]);
                  else if (options.fields.length < 2)
                    options.replace([{ value: "" }, { value: "" }]);
                }}
                className="mt-1.5 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
              >
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
        <div className="flex items-end">
          <Controller
            control={control}
            name={`questions.${index}.required`}
            render={({ field }) => (
              <label className="flex h-9 items-center gap-3">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
                <span className="text-sm font-medium">
                  Respuesta obligatoria
                </span>
              </label>
            )}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`prompt-${index}`}>Pregunta</Label>
          <Input
            id={`prompt-${index}`}
            disabled={disabled}
            className="mt-1.5"
            {...register(`questions.${index}.prompt`)}
          />
          <FieldError message={error?.prompt?.message} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`description-${index}`}>
            Ayuda o indicación{" "}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </Label>
          <Input
            id={`description-${index}`}
            disabled={disabled}
            className="mt-1.5"
            {...register(`questions.${index}.description`)}
          />
        </div>
      </div>

      {selection && (
        <div className="mt-4 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <Label>Opciones</Label>
            {!disabled && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => options.append({ value: "" })}
              >
                <Plus className="size-4" /> Agregar
              </Button>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {options.fields.map((option, optionIndex) => (
              <div key={option.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    disabled={disabled}
                    placeholder={`Opción ${optionIndex + 1}`}
                    {...register(
                      `questions.${index}.options.${optionIndex}.value`,
                    )}
                  />
                  <FieldError
                    message={error?.options?.[optionIndex]?.value?.message}
                  />
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => options.remove(optionIndex)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <FieldError
              message={
                typeof error?.options?.message === "string"
                  ? error.options.message
                  : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
