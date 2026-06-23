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
  ClipboardCheck,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Link as LinkIcon,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
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
import type { ContentKind, TeacherContent } from "@/lib/api/teacher";
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
};

const KIND_ORDER: ContentKind[] = ["TEXT", "VIDEO", "MATERIAL", "ACTIVITY"];

/** Firma de los contenidos del servidor para sincronizar el estado local. */
function signature(contents: TeacherContent[]): string {
  return contents
    .map((c) => `${c.id}:${c.order}:${c.title}:${c.isPublished}`)
    .join("|");
}

export function ContentManager({
  moduleId,
  contents,
}: {
  moduleId: string;
  contents: TeacherContent[];
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragEnd(event: DragEndEvent) {
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
            Arrastra para reordenar. Este orden es el del temario del estudiante.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setPickerOpen(true)}>
          <Plus className="size-4" /> Agregar contenido
        </Button>
      </div>

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
  editing,
  onEdit,
  onDoneEdit,
}: {
  content: TeacherContent;
  moduleId: string;
  editing: boolean;
  onEdit: () => void;
  onDoneEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: content.id });
  const meta = KIND_META[content.kind];
  const Icon = meta.icon;

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
        <button
          type="button"
          className="flex size-7 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label="Arrastrar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
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
            <PublishBadge published={content.isPublished} />
          </div>
          <p className="text-[0.7rem] text-muted-foreground">{meta.label}</p>
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
              <span className="hidden sm:inline">Calificar</span>
            </Button>
          )}
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
            confirmMessage={`Se eliminará «${content.title}».`}
          />
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  kind: ContentKind | null;
  content?: TeacherContent;
}) {
  const isEdit = Boolean(content);
  const meta = kind ? KIND_META[kind] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        {meta && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg",
                    meta.tint,
                  )}
                  aria-hidden="true"
                >
                  <meta.icon className="size-4" />
                </span>
                {isEdit ? "Editar" : "Nuevo"} {meta.label.toLowerCase()}
              </DialogTitle>
              <DialogDescription>{meta.description}</DialogDescription>
            </DialogHeader>
            {kind && (
              <ContentForm
                moduleId={moduleId}
                kind={kind}
                content={content}
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

function ContentForm({
  moduleId,
  kind,
  content,
  onDone,
  onCancel,
}: {
  moduleId: string;
  kind: ContentKind;
  content?: TeacherContent;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const uid = useId();
  const isEdit = Boolean(content);

  const [title, setTitle] = useState(content?.title ?? "");
  const [isPublished, setIsPublished] = useState(content?.isPublished ?? true);
  const [pending, startTransition] = useTransition();

  // TEXT
  const [body, setBody] = useState(content?.body ?? "");
  // VIDEO
  const [videoUrl, setVideoUrl] = useState(content?.videoUrl ?? "");
  // MATERIAL
  const [materialType, setMaterialType] = useState<"FILE" | "LINK">(
    content?.materialType ?? "LINK",
  );
  const [url, setUrl] = useState(content?.url ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // ACTIVITY
  const [activityType, setActivityType] = useState(
    content?.activityType ?? "ASSIGNMENT",
  );
  const [instructions, setInstructions] = useState(content?.instructions ?? "");
  const [dueDate, setDueDate] = useState(toLocalInput(content?.dueDate ?? null));
  const [maxScore, setMaxScore] = useState(String(content?.maxScore ?? 100));
  const [weight, setWeight] = useState(String(content?.weight ?? 0));

  async function handleUpload(file: File) {
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
    if (kind === "TEXT") payload.body = body.trim() || null;
    if (kind === "VIDEO") payload.videoUrl = videoUrl.trim();
    if (kind === "MATERIAL") {
      payload.materialType = materialType;
      payload.url = url.trim();
    }
    if (kind === "ACTIVITY") {
      payload.activityType = activityType;
      payload.instructions = instructions.trim() || null;
      payload.dueDate = dueDate ? new Date(dueDate).toISOString() : null;
      payload.maxScore = Number(maxScore) || 0;
      payload.weight = Number(weight) || 0;
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
            <div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {url ? "Reemplazar archivo" : "Seleccionar archivo"}
                </Button>
                {url && (
                  <span className="inline-flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <FileText className="size-3.5" />
                    {url.split("/").pop()}
                  </span>
                )}
              </div>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${uid}-atype`}>Tipo de actividad</Label>
              <select
                id={`${uid}-atype`}
                value={activityType}
                onChange={(e) =>
                  setActivityType(e.target.value as typeof activityType)
                }
                className="mt-1.5 h-9 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="ASSIGNMENT">Tarea</option>
                <option value="QUIZ">Cuestionario</option>
                <option value="EXAM">Examen</option>
                <option value="PROJECT">Proyecto</option>
                <option value="FORUM">Foro</option>
              </select>
            </div>
            <div>
              <Label htmlFor={`${uid}-due`}>Fecha límite (opcional)</Label>
              <Input
                id={`${uid}-due`}
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor={`${uid}-max`}>Nota máxima</Label>
              <Input
                id={`${uid}-max`}
                type="number"
                min={0}
                max={100}
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="mt-1.5"
              />
            </div>
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
          </div>
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
        <Button type="submit" size="sm" disabled={pending || uploading}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Guardar" : "Crear"}
        </Button>
      </div>
    </form>
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
