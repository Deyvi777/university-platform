"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  GraduationCap,
  GripVertical,
  Info,
  Layers,
  Loader2,
  Paperclip,
  Plus,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type UseFormRegister,
} from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { COURSE_ICON_OPTIONS } from "@/lib/course-icons";
import {
  fileSizeError,
  MAX_DOCUMENT_UPLOAD_BYTES,
  MAX_DOCUMENT_UPLOAD_MB,
} from "@/lib/upload-limits";
import { cn } from "@/lib/utils";
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
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const { register, control, handleSubmit, formState } =
    useForm<CourseFormValues>({
      resolver: zodResolver(courseFormSchema),
      defaultValues: toFormValues(course),
    });
  const { errors, isSubmitting } = formState;
  const modules = useFieldArray({ control, name: "modules" });
  const files = useFieldArray({ control, name: "files" });
  // `useWatch`, no `watch()`: compatible con React Compiler (ver AGENTS.md).
  const moduleZero = useWatch({ control, name: "moduleZero" });
  // Con módulo 0 la numeración visible (y el `order` guardado) empieza en 0.
  const orderBase = moduleZero ? 0 : 1;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onModuleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = modules.fields.findIndex((f) => f.id === active.id);
    const newIndex = modules.fields.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    modules.move(oldIndex, newIndex);
  }

  async function uploadPortfolioFiles(selected: File[]) {
    setUploadingFiles(true);
    try {
      for (const file of selected) {
        const sizeError = fileSizeError(file, MAX_DOCUMENT_UPLOAD_BYTES);
        if (sizeError) {
          toast.error(`${file.name}: ${sizeError}`);
          continue;
        }
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/teacher/upload", {
          method: "POST",
          body: form,
        });
        const data = (await response.json()) as {
          url?: string;
          message?: string;
        };
        if (!response.ok || !data.url) {
          toast.error(data.message ?? `No se pudo subir ${file.name}`);
          continue;
        }
        files.append({ name: file.name, url: data.url, size: file.size });
      }
    } finally {
      setUploadingFiles(false);
    }
  }

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

        <div className="space-y-1.5">
          <Label>Icono del programa</Label>
          <p className="text-xs text-muted-foreground">
            Se muestra en las tarjetas del panel para identificar el programa de
            un vistazo.
          </p>
          <Controller
            control={control}
            name="icon"
            render={({ field }) => (
              <div className="mt-1 grid grid-cols-6 gap-2 sm:grid-cols-9">
                {COURSE_ICON_OPTIONS.map(({ key, label, Icon }) => {
                  const selected = field.value === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      title={label}
                      aria-label={label}
                      aria-pressed={selected}
                      onClick={() => field.onChange(selected ? "" : key)}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50",
                        selected
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm dark:border-sky-400 dark:bg-sky-500"
                          : "border-border bg-background text-muted-foreground hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-sky-500/10 dark:hover:text-sky-300",
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            )}
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

      {/* Portafolio -------------------------------------------------------- */}
      <FormSection
        icon={Paperclip}
        title="Portafolio del programa"
        description="Documentación general disponible para estudiantes y docentes."
      >
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed p-5 text-center transition-colors hover:border-primary/50 hover:bg-primary/[0.03]">
          {uploadingFiles ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : (
            <Upload className="size-5 text-primary" />
          )}
          <span className="text-sm font-medium">
            {uploadingFiles
              ? "Subiendo documentos…"
              : "Adjuntar documentos al portafolio"}
          </span>
          <span className="text-xs text-muted-foreground">
            Reglamentos, cronogramas, guías y otros archivos · máximo {MAX_DOCUMENT_UPLOAD_MB} MB por archivo
          </span>
          <input
            type="file"
            multiple
            disabled={uploadingFiles}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
            onChange={(event) => {
              const selected = Array.from(event.target.files ?? []);
              if (selected.length > 0) void uploadPortfolioFiles(selected);
              event.target.value = "";
            }}
          />
        </label>

        {files.fields.length > 0 ? (
          <ul className="space-y-2">
            {files.fields.map((file, index) => (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3"
              >
                <Paperclip className="size-4 shrink-0 text-primary" />
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary hover:underline"
                >
                  {file.name}
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar ${file.name}`}
                  onClick={() => files.remove(index)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            Todavía no hay documentos en el portafolio.
          </p>
        )}
      </FormSection>

      {/* Módulos ----------------------------------------------------------- */}
      <FormSection
        icon={Layers}
        title="Módulos"
        description="Define la malla del programa. Arrastra para reordenar: el número de cada módulo es su posición en la lista. Podrás asignar docentes a cada módulo después de crearlo."
      >
        {errors.modules?.root && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="size-3.5" aria-hidden="true" />
            {errors.modules.root.message}
          </p>
        )}

        <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-3">
          <div className="space-y-0.5">
            <Label htmlFor="moduleZero">Incluir módulo 0</Label>
            <p className="text-xs text-muted-foreground">
              La numeración empieza en 0: el primer módulo de la lista es el
              «Módulo 0» (p. ej. nivelación o inducción).
            </p>
          </div>
          <Controller
            control={control}
            name="moduleZero"
            render={({ field }) => (
              <Switch
                id="moduleZero"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="mt-1"
              />
            )}
          />
        </div>

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onModuleDragEnd}
          >
            <SortableContext
              items={modules.fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="space-y-2.5">
                {modules.fields.map((field, index) => (
                  <SortableModuleRow
                    key={field.id}
                    fieldId={field.id}
                    number={index + orderBase}
                    register={register}
                    index={index}
                    error={errors.modules?.[index]?.name?.message}
                    removeDisabled={modules.fields.length === 1}
                    onRemove={() => modules.remove(index)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
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

/** Fila de módulo reordenable: asa de arrastre + número por posición + nombre.
 * El id sortable es el `id` del field array (estable entre reordenes). */
function SortableModuleRow({
  fieldId,
  number,
  index,
  register,
  error,
  removeDisabled,
  onRemove,
}: {
  fieldId: string;
  number: number;
  index: number;
  register: UseFormRegister<CourseFormValues>;
  error?: string;
  removeDisabled: boolean;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldId });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-start gap-2 rounded-lg border bg-background p-3",
        isDragging && "relative z-10 shadow-lg",
      )}
    >
      <button
        type="button"
        className="mt-0.5 flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
        aria-label={`Arrastrar para reordenar el módulo ${number}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span
        className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground"
        aria-hidden="true"
      >
        {number}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <Input
          placeholder={`Nombre del módulo ${number}`}
          aria-label={`Nombre del módulo ${number}`}
          aria-invalid={error ? true : undefined}
          {...register(`modules.${index}.name` as const)}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="mt-0.5 text-muted-foreground hover:text-destructive"
        aria-label={`Quitar módulo ${number}`}
        disabled={removeDisabled}
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
