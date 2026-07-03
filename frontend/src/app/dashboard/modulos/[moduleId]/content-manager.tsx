"use client";

import { useId, useRef, useState, useTransition } from "react";
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
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  Folder,
  GripVertical,
  Link as LinkIcon,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import {
  ACTIVITY_TYPE_OPTIONS,
  ACTIVITY_TYPES,
} from "@/lib/activity-types";
import type {
  ContentKind,
  RecoveryStage,
  TeacherContent,
} from "@/lib/api/teacher";
import {
  fileSizeError,
  MAX_DOCUMENT_UPLOAD_BYTES,
  MAX_DOCUMENT_UPLOAD_MB,
} from "@/lib/upload-limits";
import { cn } from "@/lib/utils";
import {
  createContentAction,
  deleteContentAction,
  reorderContentsAction,
  updateContentAction,
  type ContentPayload,
} from "./actions";

const KIND_META: Record<
  ContentKind,
  { label: string; description: string; icon: typeof FileText; tint: string }
> = {
  TEXT: {
    label: "Tema",
    description: "Texto enriquecido con el editor",
    icon: FileText,
    tint: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  },
  VIDEO: {
    label: "Video",
    description: "Enlace de YouTube o Vimeo",
    icon: Video,
    tint: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
  MATERIAL: {
    label: "Material",
    description: "Archivo para descargar o enlace",
    icon: Paperclip,
    tint: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  ACTIVITY: {
    label: "Actividad",
    description: "Tarea evaluable con entrega y nota",
    icon: ClipboardList,
    tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  FOLDER: {
    label: "Carpeta",
    description: "Agrupa varios archivos descargables",
    icon: Folder,
    tint: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
};

const KIND_ORDER: ContentKind[] = [
  "TEXT",
  "VIDEO",
  "MATERIAL",
  "ACTIVITY",
  "FOLDER",
];

// Etiquetas/estilos del examen de recuperación (nota que reemplaza la del módulo).
const RECOVERY_META: Record<
  RecoveryStage,
  { label: string; badge: string }
> = {
  RECUPERATORIO: {
    label: "Recuperatorio",
    badge:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
  SEGUNDA_INSTANCIA: {
    label: "Segunda instancia",
    badge:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  },
};

/** Firma de los contenidos del servidor para sincronizar el estado local.
 * Incluye los archivos de las carpetas para que, al editarlos (agregar/quitar/
 * reordenar) y guardar, el estado local se resincronice con el servidor. */
function signature(contents: TeacherContent[]): string {
  return contents
    .map(
      (c) =>
        `${c.id}:${c.order}:${c.title}:${c.isPublished}:${(c.folderFiles ?? [])
          .map((f) => f.id)
          .join(",")}`,
    )
    .join("|");
}

export function ContentManager({
  moduleId,
  contents,
  readOnly = false,
  isAdmin = false,
  failedCount = 0,
}: {
  moduleId: string;
  contents: TeacherContent[];
  /** Módulo concluido: el temario queda en solo lectura. */
  readOnly?: boolean;
  /** El ADMIN además puede habilitar la segunda instancia. */
  isAdmin?: boolean;
  /** Estudiantes con nota reprobada (habilita el recuperatorio). */
  failedCount?: number;
}) {
  const router = useRouter();
  // Las actividades presenciales no son lecciones del temario: se gestionan en
  // la libreta de calificaciones, no aquí.
  const temarioContents = contents.filter((c) => !c.isOffline);
  // Estado local de orden (para drag-and-drop optimista). Se sincroniza con el
  // servidor comparando una firma durante el render (patrón recomendado por
  // React: guardar el valor previo en estado, no en un ref ni en useEffect).
  const [items, setItems] = useState(temarioContents);
  const [prevSig, setPrevSig] = useState(() => signature(temarioContents));
  const incoming = signature(temarioContents);
  if (incoming !== prevSig) {
    setPrevSig(incoming);
    setItems(temarioContents);
  }

  const [adding, setAdding] = useState<ContentKind | null>(null);
  const [addingRecovery, setAddingRecovery] = useState<RecoveryStage | null>(
    null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Recuperatorio / segunda instancia: se habilitan sobre el módulo CONCLUIDO
  // cuando hay reprobados. Máx. uno por etapa; la segunda solo por el admin.
  const hasRecuperatorio = contents.some(
    (c) => c.recoveryStage === "RECUPERATORIO",
  );
  const hasSegunda = contents.some(
    (c) => c.recoveryStage === "SEGUNDA_INSTANCIA",
  );
  const canEnableRecuperatorio =
    readOnly && !hasRecuperatorio && failedCount > 0;
  const canEnableSegunda =
    readOnly && isAdmin && hasRecuperatorio && !hasSegunda && failedCount > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragEnd(event: DragEndEvent) {
    if (readOnly) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startTransition(async () => {
      const result = await reorderContentsAction(
        moduleId,
        next.map((i) => i.id),
      );
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error);
        setItems(items); // revertir
      }
    });
  }

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold">Contenidos</h2>
          <p className="text-xs text-muted-foreground">
            {readOnly
              ? "Módulo concluido: el temario es solo de lectura."
              : "Arrastra para reordenar. Este orden es el del temario del estudiante."}
          </p>
        </div>
        {!readOnly ? (
          <Button type="button" size="sm" onClick={() => setPickerOpen(true)}>
            <Plus className="size-4" /> Agregar contenido
          </Button>
        ) : (
          (canEnableRecuperatorio || canEnableSegunda) && (
            <div className="flex flex-wrap justify-end gap-2">
              {canEnableRecuperatorio && (
                <Button
                  type="button"
                  size="sm"
                  className="bg-rose-600 text-white hover:bg-rose-700"
                  onClick={() => setAddingRecovery("RECUPERATORIO")}
                >
                  <RotateCcw className="size-4" /> Habilitar recuperatorio
                </Button>
              )}
              {canEnableSegunda && (
                <Button
                  type="button"
                  size="sm"
                  className="bg-purple-600 text-white hover:bg-purple-700"
                  onClick={() => setAddingRecovery("SEGUNDA_INSTANCIA")}
                >
                  <RotateCcw className="size-4" /> Habilitar segunda instancia
                </Button>
              )}
            </div>
          )
        )}
      </div>

      {/* Aviso de recuperación disponible (módulo concluido con reprobados) */}
      {(canEnableRecuperatorio || canEnableSegunda) && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          Hay {failedCount}{" "}
          {failedCount === 1 ? "estudiante reprobado" : "estudiantes reprobados"}{" "}
          en este módulo.{" "}
          {canEnableRecuperatorio
            ? "Puedes habilitar un examen recuperatorio: solo lo verán los reprobados y su nota reemplazará la nota final del módulo."
            : "Puedes habilitar la segunda instancia para quienes reprobaron el recuperatorio: su nota reemplazará la nota final del módulo."}
        </p>
      )}

      {/* Selector de tipo (modal) */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>¿Qué quieres agregar?</DialogTitle>
            <DialogDescription>
              Elige el tipo de contenido que se sumará al temario.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 sm:grid-cols-2">
            {KIND_ORDER.map((kind) => {
              const meta = KIND_META[kind];
              const Icon = meta.icon;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => {
                    setPickerOpen(false);
                    setAdding(kind);
                  }}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      meta.tint,
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="size-4.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {meta.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {meta.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulario de creación (modal) */}
      <ContentFormDialog
        open={adding !== null}
        onOpenChange={(open) => {
          if (!open) setAdding(null);
        }}
        moduleId={moduleId}
        kind={adding}
      />

      {/* Formulario del examen de recuperación (modal) */}
      <ContentFormDialog
        open={addingRecovery !== null}
        onOpenChange={(open) => {
          if (!open) setAddingRecovery(null);
        }}
        moduleId={moduleId}
        kind={addingRecovery ? "ACTIVITY" : null}
        recoveryStage={addingRecovery}
      />

      {/* Lista ordenable */}
      <div className="mt-4">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Aún no hay contenidos
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              Agrega un tema, video, material o actividad para armar el temario.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {items.map((content) => (
                  <SortableRow
                    key={content.id}
                    content={content}
                    moduleId={moduleId}
                    readOnly={readOnly}
                    isAdmin={isAdmin}
                    editing={editingId === content.id}
                    onEdit={() =>
                      setEditingId(
                        editingId === content.id ? null : content.id,
                      )
                    }
                    onDoneEdit={() => setEditingId(null)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </section>
  );
}

function SortableRow({
  content,
  moduleId,
  readOnly,
  isAdmin,
  editing,
  onEdit,
  onDoneEdit,
}: {
  content: TeacherContent;
  moduleId: string;
  readOnly: boolean;
  isAdmin: boolean;
  editing: boolean;
  onEdit: () => void;
  onDoneEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: content.id, disabled: readOnly });
  const meta = KIND_META[content.kind];
  const Icon = meta.icon;
  const recovery = content.recoveryStage
    ? RECOVERY_META[content.recoveryStage]
    : null;
  // Un examen de recuperación vive en un módulo concluido: se gestiona igual
  // (la segunda instancia solo por el admin; el backend también lo exige).
  const canManage =
    !readOnly ||
    (content.recoveryStage != null &&
      (content.recoveryStage === "RECUPERATORIO" || isAdmin));

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "overflow-hidden rounded-xl border bg-background",
        isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      <div className="flex items-center gap-2 px-2 py-2.5 sm:px-3">
        {!readOnly && (
          <button
            type="button"
            className="flex size-7 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
            aria-label="Arrastrar para reordenar"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        )}
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            meta.tint,
          )}
          aria-hidden="true"
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">{content.title}</p>
            {recovery && (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
                  recovery.badge,
                )}
              >
                <RotateCcw className="size-3" /> {recovery.label}
              </span>
            )}
            <PublishBadge published={content.isPublished} />
          </div>
          <p className="text-[0.7rem] text-muted-foreground">
            {content.kind === "FOLDER"
              ? `${content.folderFiles?.length ?? 0} ${
                  (content.folderFiles?.length ?? 0) === 1
                    ? "archivo"
                    : "archivos"
                }`
              : meta.label}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {content.kind === "ACTIVITY" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              render={<Link href={`/dashboard/actividades/${content.id}`} />}
            >
              <ClipboardCheck className="size-4" />
              <span className="hidden sm:inline">
                {content.activityType === "QUIZ" ||
                content.activityType === "EXAM"
                  ? "Preguntas"
                  : "Calificar"}
              </span>
            </Button>
          )}
          {canManage && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Editar contenido"
                onClick={onEdit}
              >
                <Pencil className="size-4" />
              </Button>
              <DeleteButton
                action={() => deleteContentAction(moduleId, content.id)}
                title="¿Eliminar este contenido?"
                confirmMessage={
                  content.recoveryStage
                    ? `Se eliminará «${content.title}»${
                        content.submissionCount > 0
                          ? ` con los intentos de los estudiantes; sus notas volverán a la nota original del módulo`
                          : ""
                      }. Esta acción no se puede deshacer.`
                    : content.kind === "ACTIVITY" && content.submissionCount > 0
                      ? `Se eliminará «${content.title}» y de forma permanente ${
                          content.submissionCount
                        } ${
                          content.submissionCount === 1
                            ? "entrega de estudiante"
                            : "entregas de estudiantes"
                        } (con sus archivos y calificaciones). Esta acción no se puede deshacer.`
                      : `Se eliminará «${content.title}».`
                }
              />
            </>
          )}
        </div>
      </div>

      <ContentFormDialog
        open={editing}
        onOpenChange={(open) => {
          if (!open) onDoneEdit();
        }}
        moduleId={moduleId}
        kind={content.kind}
        content={content}
        recoveryStage={content.recoveryStage}
      />
    </li>
  );
}

function PublishBadge({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
        published
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-muted text-muted-foreground",
      )}
    >
      {published ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
      {published ? "Publicado" : "Borrador"}
    </span>
  );
}

// ── Modal del formulario (crear / editar) ─────────────────────────────────────

/**
 * Envuelve el `ContentForm` en un `Dialog`. El cuerpo es alto (editor Tiptap en
 * "Tema", varios campos en "Actividad"), así que el contenido limita su altura
 * al viewport y hace scroll interno — el botón X y el header quedan dentro del
 * popup, no del área scrolleable. El form se monta/desmonta con la apertura, lo
 * que reinicializa el editor por cada apertura (esperado, `immediatelyRender:false`).
 */
function ContentFormDialog({
  open,
  onOpenChange,
  moduleId,
  kind,
  content,
  recoveryStage = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  kind: ContentKind | null;
  content?: TeacherContent;
  /** Examen de recuperación: fija el tipo (EXAM) y su nota reemplaza la del módulo. */
  recoveryStage?: RecoveryStage | null;
}) {
  const isEdit = Boolean(content);
  const meta = kind ? KIND_META[kind] : null;
  const recovery = recoveryStage ? RECOVERY_META[recoveryStage] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        {meta && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg",
                    recovery ? recovery.badge : meta.tint,
                  )}
                  aria-hidden="true"
                >
                  {recovery ? (
                    <RotateCcw className="size-4" />
                  ) : (
                    <meta.icon className="size-4" />
                  )}
                </span>
                {recovery
                  ? `${isEdit ? "Editar" : "Habilitar"} ${recovery.label.toLowerCase()}`
                  : `${isEdit ? "Editar" : "Nuevo"} ${meta.label.toLowerCase()}`}
              </DialogTitle>
              <DialogDescription>
                {recovery
                  ? "Examen para los estudiantes reprobados: su nota reemplaza la nota final del módulo."
                  : meta.description}
              </DialogDescription>
            </DialogHeader>
            {kind && (
              <ContentForm
                // Remonta el formulario cuando cambian los archivos de la
                // carpeta (ids tras guardar) para no mostrar estado obsoleto.
                key={
                  content
                    ? `${content.id}:${(content.folderFiles ?? [])
                        .map((f) => f.id)
                        .join(",")}`
                    : (kind ?? "new")
                }
                moduleId={moduleId}
                kind={kind}
                content={content}
                recoveryStage={recoveryStage}
                onDone={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Formulario por tipo ───────────────────────────────────────────────────────

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

// Presets de hora: un clic deja una hora típica.
const DUE_TIME_PRESETS = [
  { label: "Fin del día", time: "23:59" },
  { label: "Mediodía", time: "12:00" },
  { label: "Mañana", time: "08:00" },
];

// Fecha+hora legible (p. ej. "lunes 6 de julio de 2026, 23:59").
function formatDateTime(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const fecha = d.toLocaleDateString("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hora = d.toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${fecha}, ${hora}`;
}

/**
 * Campo de fecha + hora separadas y claras (reemplaza al `datetime-local`
 * nativo donde la hora pasa desapercibida). Reutilizable para "Fecha límite" y
 * para las ventanas "Abre/Cierra" de cuestionarios. El valor es el string
 * `YYYY-MM-DDTHH:mm` que espera el payload.
 */
function DateTimeField({
  idBase,
  label,
  value,
  onChange,
  defaultTime = "23:59",
  summaryPrefix,
  emptyText,
}: {
  idBase: string;
  label: React.ReactNode;
  value: string;
  onChange: (next: string) => void;
  /** Hora asumida al elegir fecha sin tocar la hora. */
  defaultTime?: string;
  /** Prefijo del resumen, p. ej. "Vence el" / "Abre el" / "Cierra el". */
  summaryPrefix?: string;
  /** Texto cuando no hay fecha. */
  emptyText?: string;
}) {
  const datePart = value ? value.slice(0, 10) : "";
  const timePart = value ? value.slice(11, 16) : "";
  const human = formatDateTime(value);

  function setDate(next: string) {
    if (!next) {
      onChange(""); // sin fecha
      return;
    }
    onChange(`${next}T${timePart || defaultTime}`);
  }
  function setTime(next: string) {
    if (!datePart) return; // la hora necesita una fecha
    onChange(`${datePart}T${next || defaultTime}`);
  }

  const presetBtn =
    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40";

  return (
    <div>
      <Label htmlFor={`${idBase}-date`}>{label}</Label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <div className="min-w-36 flex-1">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Fecha
          </span>
          <Input
            id={`${idBase}-date`}
            type="date"
            value={datePart}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="min-w-28">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Hora
          </span>
          <Input
            id={`${idBase}-time`}
            type="time"
            value={timePart}
            disabled={!datePart}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      {datePart ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Hora rápida:</span>
          {DUE_TIME_PRESETS.map((p) => (
            <button
              key={p.time}
              type="button"
              onClick={() => setTime(p.time)}
              className={cn(
                presetBtn,
                timePart === p.time && "border-primary bg-primary/10 text-primary",
              )}
            >
              {p.label} · {p.time}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange("")}
            className="ml-auto rounded-full px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            Quitar
          </button>
        </div>
      ) : null}

      <p className="mt-2 text-xs text-muted-foreground">
        {human ? `${summaryPrefix ?? ""} ${human}`.trim() : emptyText}
      </p>
    </div>
  );
}

function ContentForm({
  moduleId,
  kind,
  content,
  recoveryStage = null,
  onDone,
  onCancel,
}: {
  moduleId: string;
  kind: ContentKind;
  content?: TeacherContent;
  /** Examen de recuperación: tipo fijo EXAM, sin peso (no pondera). */
  recoveryStage?: RecoveryStage | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const uid = useId();
  const isEdit = Boolean(content);
  const isRecovery = recoveryStage != null;

  const [title, setTitle] = useState(
    content?.title ??
      (recoveryStage ? RECOVERY_META[recoveryStage].label : ""),
  );
  const [isPublished, setIsPublished] = useState(content?.isPublished ?? true);
  const [pending, startTransition] = useTransition();

  // TEXT
  const [body, setBody] = useState(content?.body ?? "");
  // VIDEO
  const [videoUrl, setVideoUrl] = useState(content?.videoUrl ?? "");
  // MATERIAL — por defecto "Subir archivo" (lo más común para el docente).
  const [materialType, setMaterialType] = useState<"FILE" | "LINK">(
    content?.materialType ?? "FILE",
  );
  const [url, setUrl] = useState(content?.url ?? "");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // ACTIVITY — un examen de recuperación siempre es EXAM (motor de preguntas).
  const [activityType, setActivityType] = useState(
    content?.activityType ?? (isRecovery ? "EXAM" : "ASSIGNMENT"),
  );
  const [instructions, setInstructions] = useState(content?.instructions ?? "");
  const [dueDate, setDueDate] = useState(toLocalInput(content?.dueDate ?? null));
  const [maxScore, setMaxScore] = useState(String(content?.maxScore ?? 100));
  const [weight, setWeight] = useState(String(content?.weight ?? 100));
  // QUIZ/EXAM — ajustes del motor de preguntas.
  const [timeLimitMin, setTimeLimitMin] = useState(
    content?.timeLimitMin != null ? String(content.timeLimitMin) : "",
  );
  const [availableFrom, setAvailableFrom] = useState(
    toLocalInput(content?.availableFrom ?? null),
  );
  const [availableUntil, setAvailableUntil] = useState(
    toLocalInput(content?.availableUntil ?? null),
  );
  const [singleAttempt, setSingleAttempt] = useState(
    content?.singleAttempt ?? true,
  );
  const [shuffle, setShuffle] = useState(content?.shuffle ?? true);
  const [revealAnswers, setRevealAnswers] = useState(
    content?.revealAnswers ?? false,
  );
  // FOLDER — cada archivo lleva un `key` estable (id existente o uuid del
  // cliente) para React y para el drag-and-drop.
  const [folderFiles, setFolderFiles] = useState<
    { key: string; name: string; url: string; size: number | null }[]
  >(
    content?.folderFiles?.map((f) => ({
      key: f.id,
      name: f.name,
      url: f.url,
      size: f.size,
    })) ?? [],
  );
  const [folderUploading, setFolderUploading] = useState(false);
  const [folderDragOver, setFolderDragOver] = useState(false);
  const folderFileRef = useRef<HTMLInputElement>(null);
  const folderSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onFolderDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFolderFiles((prev) => {
      const oldIndex = prev.findIndex((f) => f.key === active.id);
      const newIndex = prev.findIndex((f) => f.key === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  async function handleFolderUpload(file: File) {
    const sizeError = fileSizeError(file, MAX_DOCUMENT_UPLOAD_BYTES);
    if (sizeError) {
      toast.error(`${file.name}: ${sizeError}`);
      return;
    }
    setFolderUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/teacher/upload", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.message ?? "Error al subir el archivo");
      }
      setFolderFiles((prev) => [
        ...prev,
        {
          key: crypto.randomUUID(),
          name: file.name,
          url: data.url as string,
          size: file.size,
        },
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setFolderUploading(false);
    }
  }

  async function handleFolderFiles(files: File[]) {
    for (const f of files) {
      await handleFolderUpload(f);
    }
  }

  async function handleUpload(file: File) {
    const sizeError = fileSizeError(file, MAX_DOCUMENT_UPLOAD_BYTES);
    if (sizeError) {
      toast.error(sizeError);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/teacher/upload", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.message ?? "Error al subir el archivo");
      }
      setUrl(data.url);
      toast.success("Archivo subido");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    if (kind === "VIDEO" && !videoUrl.trim()) {
      toast.error("Pega el enlace del video");
      return;
    }
    if (kind === "MATERIAL" && !url.trim()) {
      toast.error("Sube un archivo o pega un enlace");
      return;
    }

    const payload: ContentPayload = {
      title: title.trim(),
      isPublished,
    };
    if (!isEdit) payload.kind = kind;
    // El examen de recuperación se marca al crear (no se puede convertir luego).
    if (!isEdit && recoveryStage) payload.recoveryStage = recoveryStage;
    if (kind === "TEXT") payload.body = body.trim() || null;
    if (kind === "VIDEO") payload.videoUrl = videoUrl.trim();
    if (kind === "MATERIAL") {
      payload.materialType = materialType;
      payload.url = url.trim();
    }
    if (kind === "ACTIVITY") {
      const isQuiz = activityType === "QUIZ" || activityType === "EXAM";
      payload.activityType = activityType;
      payload.instructions = instructions.trim() || null;
      // Campo vacío/inválido → cae al default 100 (el backend rechaza maxScore 0:
      // una actividad "sobre 0" no es calificable).
      payload.maxScore = Number(maxScore) > 0 ? Number(maxScore) : 100;
      // La recuperación no pondera (su nota reemplaza la del módulo) → peso 0.
      payload.weight = isRecovery ? 0 : Number(weight) || 0;
      // Ajustes del motor de preguntas (solo QUIZ/EXAM; null en los demás).
      payload.timeLimitMin =
        isQuiz && timeLimitMin.trim() ? Number(timeLimitMin) || null : null;
      payload.availableFrom =
        isQuiz && availableFrom
          ? new Date(availableFrom).toISOString()
          : null;
      payload.availableUntil =
        isQuiz && availableUntil
          ? new Date(availableUntil).toISOString()
          : null;
      payload.singleAttempt = isQuiz ? singleAttempt : null;
      payload.shuffle = isQuiz ? shuffle : null;
      payload.revealAnswers = isQuiz ? revealAnswers : null;
      // El plazo: en quiz lo define el "Cierra" (para el calendario/LATE); en
      // los demás tipos, la fecha límite propia.
      const deadline = isQuiz ? availableUntil : dueDate;
      payload.dueDate = deadline ? new Date(deadline).toISOString() : null;
    }
    if (kind === "FOLDER") {
      payload.files = folderFiles.map(({ name, url, size }) => ({
        name,
        url,
        size,
      }));
    }

    startTransition(async () => {
      const result =
        isEdit && content
          ? await updateContentAction(moduleId, content.id, payload)
          : await createContentAction(moduleId, payload);
      if (result.ok) {
        toast.success(isEdit ? "Contenido actualizado" : "Contenido creado");
        onDone();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor={`${uid}-title`}>Título</Label>
        <Input
          id={`${uid}-title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título del contenido"
          className="mt-1.5"
          autoFocus
        />
      </div>

      {kind === "TEXT" && (
        <div>
          <Label>Contenido del tema</Label>
          <div className="mt-1.5">
            <RichTextEditor value={body} onChange={setBody} />
          </div>
        </div>
      )}

      {kind === "VIDEO" && (
        <div>
          <Label htmlFor={`${uid}-video`}>Enlace del video</Label>
          <Input
            id={`${uid}-video`}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…  ó  https://vimeo.com/…"
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Se mostrará embebido con el reproductor de la plataforma.
          </p>
        </div>
      )}

      {kind === "MATERIAL" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <SegBtn
              active={materialType === "FILE"}
              onClick={() => setMaterialType("FILE")}
              icon={<Upload className="size-4" />}
            >
              Subir archivo
            </SegBtn>
            <SegBtn
              active={materialType === "LINK"}
              onClick={() => setMaterialType("LINK")}
              icon={<LinkIcon className="size-4" />}
            >
              Enlace externo
            </SegBtn>
          </div>
          {materialType === "FILE" ? (
            <div className="space-y-2.5">
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                }}
              />
              {/* Zona de arrastre: arrastrar o hacer clic para seleccionar. */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Arrastra y suelta un archivo aquí, o haz clic para seleccionarlo"
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) void handleUpload(f);
                }}
                className={cn(
                  "flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-12 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  dragOver
                    ? "border-primary bg-primary/10 text-primary"
                    : url
                      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 hover:border-emerald-500/60 dark:text-emerald-300"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/40",
                )}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-8 animate-spin" aria-hidden="true" />
                    <p className="text-sm font-medium">Subiendo…</p>
                  </>
                ) : (
                  <>
                    <Upload className="size-8" aria-hidden="true" />
                    <p className="text-sm font-medium">
                      {url
                        ? "Arrastra otro archivo para reemplazarlo"
                        : "Arrastra y suelta un archivo aquí"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      haz clic aquí para seleccionar el archivo
                    </p>
                  </>
                )}
              </div>
              <p className="text-center text-[11px] text-muted-foreground">
                Tamaño máximo: {MAX_DOCUMENT_UPLOAD_MB} MB
              </p>
              {/* Archivo cargado: tarjeta resaltada para que el docente note
                  que la subida fue exitosa. */}
              {url && (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">Archivo cargado</p>
                    <p className="truncate text-xs text-emerald-700/80 dark:text-emerald-300/70">
                      {url.split("/").pop()}
                    </p>
                  </div>
                  <FileText className="size-4 shrink-0 text-emerald-600/70 dark:text-emerald-400/70" />
                </div>
              )}
            </div>
          ) : (
            <div>
              <Label htmlFor={`${uid}-url`}>URL del recurso</Label>
              <Input
                id={`${uid}-url`}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="mt-1.5"
              />
            </div>
          )}
        </div>
      )}

      {kind === "ACTIVITY" && (
        <div className="space-y-3">
          {/* Recuperación: tipo fijo (examen), sin peso — la nota reemplaza. */}
          {isRecovery && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              Este examen solo lo verán los estudiantes{" "}
              {recoveryStage === "SEGUNDA_INSTANCIA"
                ? "que reprobaron el recuperatorio"
                : "reprobados"}
              . La nota que obtengan <strong>reemplazará su nota final del
              módulo</strong> (no pondera con las demás actividades); quien no lo
              rinda conserva su nota actual.
            </p>
          )}
          {/* Tipo de actividad: selector visual (cada tipo funciona distinto). */}
          {!isRecovery && (
          <div>
            <Label>Tipo de actividad</Label>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ACTIVITY_TYPE_OPTIONS.map(
                ({ key, label, Icon, tint, description }) => {
                  const selected = activityType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setActivityType(key)}
                      className={cn(
                        "flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:border-muted-foreground/30 hover:bg-accent",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          tint,
                        )}
                        aria-hidden="true"
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {label}
                        </span>
                        <span className="block text-xs leading-snug text-muted-foreground">
                          {description}
                        </span>
                      </span>
                    </button>
                  );
                },
              )}
            </div>
            <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              {ACTIVITY_TYPES[activityType].helpCopy}
            </p>
          </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${uid}-max`}>Nota máxima</Label>
              <Input
                id={`${uid}-max`}
                type="number"
                min={1}
                max={100}
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="mt-1.5"
              />
            </div>
            {/* La recuperación no pondera: sin campo de peso. */}
            {!isRecovery && (
              <div>
                <Label htmlFor={`${uid}-weight`}>Peso (%)</Label>
                <Input
                  id={`${uid}-weight`}
                  type="number"
                  min={0}
                  max={100}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            )}
          </div>
          {/* Fecha límite: solo para tipos con entrega (no quiz). En
              cuestionarios/exámenes el plazo lo define la ventana "Cierra". */}
          {activityType !== "QUIZ" && activityType !== "EXAM" && (
            <DateTimeField
              idBase={`${uid}-due`}
              label={
                <>
                  Fecha límite{" "}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </>
              }
              value={dueDate}
              onChange={setDueDate}
              defaultTime="23:59"
              summaryPrefix="Vence el"
              emptyText="Sin fecha límite: la actividad no tendrá plazo de entrega."
            />
          )}
          <div>
            <Label htmlFor={`${uid}-instr`}>Instrucciones (opcional)</Label>
            <Textarea
              id={`${uid}-instr`}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe lo que el estudiante debe entregar…"
              className="mt-1.5 min-h-24"
            />
          </div>

          {/* Ajustes del motor de preguntas (QUIZ/EXAM) */}
          {(activityType === "QUIZ" || activityType === "EXAM") && (
            <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Ajustes del {activityType === "EXAM" ? "examen" : "cuestionario"}
              </p>

              <div className="max-w-48">
                <Label htmlFor={`${uid}-tl`}>Tiempo límite (min)</Label>
                <Input
                  id={`${uid}-tl`}
                  type="number"
                  min={0}
                  placeholder="Sin límite"
                  value={timeLimitMin}
                  onChange={(e) => setTimeLimitMin(e.target.value)}
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Cronómetro una vez iniciado. Vacío = sin límite.
                </p>
              </div>

              {/* Disponibilidad: ventana en que se puede rendir. "Cierra" es el
                  plazo real del cuestionario/examen (reemplaza a la fecha límite). */}
              <div className="space-y-2 rounded-lg border bg-background p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Disponibilidad
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DateTimeField
                    idBase={`${uid}-af`}
                    label="Abre"
                    value={availableFrom}
                    onChange={setAvailableFrom}
                    defaultTime="08:00"
                    summaryPrefix="Abre el"
                    emptyText="Disponible apenas se publique."
                  />
                  <DateTimeField
                    idBase={`${uid}-au`}
                    label="Cierra"
                    value={availableUntil}
                    onChange={setAvailableUntil}
                    defaultTime="23:59"
                    summaryPrefix="Cierra el"
                    emptyText="Sin cierre: disponible hasta que concluya el módulo."
                  />
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Intento único</span>
                <Switch
                  checked={singleAttempt}
                  onCheckedChange={setSingleAttempt}
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Barajar preguntas y opciones</span>
                <Switch checked={shuffle} onCheckedChange={setShuffle} />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Mostrar respuestas correctas al terminar</span>
                <Switch
                  checked={revealAnswers}
                  onCheckedChange={setRevealAnswers}
                />
              </label>
              <p className="rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground">
                Las <strong>preguntas</strong> se arman desde la actividad: guarda
                primero y luego abre <strong>“Preguntas”</strong> (en la fila del
                temario) para añadirlas.
              </p>
            </div>
          )}
        </div>
      )}

      {kind === "FOLDER" && (
        <div className="space-y-3">
          <input
            ref={folderFileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) void handleFolderFiles(files);
              e.target.value = "";
            }}
          />
          {/* Zona de arrastre: arrastrar o hacer clic para seleccionar varios. */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Arrastra y suelta archivos aquí, o haz clic para seleccionarlos"
            onClick={() => folderFileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                folderFileRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setFolderDragOver(true);
            }}
            onDragLeave={() => setFolderDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setFolderDragOver(false);
              const files = Array.from(e.dataTransfer.files ?? []);
              if (files.length) void handleFolderFiles(files);
            }}
            className={cn(
              "flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              folderDragOver
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/40",
            )}
          >
            {folderUploading ? (
              <>
                <Loader2 className="size-8 animate-spin" aria-hidden="true" />
                <p className="text-sm font-medium">Subiendo…</p>
              </>
            ) : (
              <>
                <Upload className="size-8" aria-hidden="true" />
                <p className="text-sm font-medium">
                  Arrastra y suelta archivos aquí
                </p>
                <p className="text-xs text-muted-foreground">
                  haz clic aquí para seleccionar los archivos
                </p>
              </>
            )}
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Puedes agregar varios. Tamaño máximo: {MAX_DOCUMENT_UPLOAD_MB} MB por
            archivo.
          </p>
          {/* Archivos agregados a la carpeta (arrastra para reordenar) */}
          {folderFiles.length > 0 && (
            <DndContext
              sensors={folderSensors}
              collisionDetection={closestCenter}
              onDragEnd={onFolderDragEnd}
            >
              <SortableContext
                items={folderFiles.map((f) => f.key)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1.5">
                  {folderFiles.map((f) => (
                    <SortableFolderFileRow
                      key={f.key}
                      id={f.key}
                      name={f.name}
                      onRemove={() =>
                        setFolderFiles((prev) =>
                          prev.filter((x) => x.key !== f.key),
                        )
                      }
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      <label className="flex items-center gap-2.5">
        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
        <span className="text-sm">Visible para los estudiantes</span>
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="size-4" /> Cancelar
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={pending || uploading || folderUploading}
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Guardar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}

/** Fila de un archivo dentro del formulario de carpeta (sortable con asa). */
function SortableFolderFileRow({
  id,
  name,
  onRemove,
}: {
  id: string;
  name: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-background px-3 py-2",
        isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      <button
        type="button"
        className="flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <FileText className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
      <span className="min-w-0 flex-1 truncate text-xs">{name}</span>
      <button
        type="button"
        aria-label={`Quitar ${name}`}
        className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

function SegBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "bg-background text-muted-foreground hover:bg-muted/60",
      )}
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </button>
  );
}
