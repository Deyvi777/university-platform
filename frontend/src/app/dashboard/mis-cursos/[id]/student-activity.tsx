"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  Award,
  CalendarClock,
  Check,
  Download,
  Loader2,
  Paperclip,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ACTIVITY_TYPES } from "@/lib/activity-types";
import type {
  CourseActivity,
  SubmissionFile,
  SubmissionStatus,
} from "@/lib/api/me";
import { DUE_URGENCY_CLS, dueUrgency } from "@/lib/due-date";
import {
  fileSizeError,
  MAX_DOCUMENT_UPLOAD_BYTES,
  MAX_DOCUMENT_UPLOAD_MB,
} from "@/lib/upload-limits";
import { cn } from "@/lib/utils";
import { removeSubmissionFileAction, submitActivityAction } from "./actions";

const STATUS_META: Record<
  SubmissionStatus,
  { label: string; badge: string }
> = {
  PENDING: { label: "Sin entregar", badge: "bg-muted text-muted-foreground" },
  SUBMITTED: {
    label: "Entregada",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
  LATE: {
    label: "Entregada tarde",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  GRADED: {
    label: "Calificada",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
};

function formatDue(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("es-BO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StudentActivity({
  courseId,
  activity,
  readOnly = false,
}: {
  courseId: string;
  activity: CourseActivity;
  /** Módulo concluido: solo se puede ver la entrega, no enviar/editar. */
  readOnly?: boolean;
}) {
  const sub = activity.submission;
  const status: SubmissionStatus = sub?.status ?? "PENDING";
  const meta = STATUS_META[status];
  const isGraded = status === "GRADED";
  const due = formatDue(activity.dueDate);
  // "Ahora" fijado una vez por montaje (patrón de ProfileCalendar): suficiente
  // para teñir el plazo por urgencia sin llamar Date.now() en cada render.
  const now = useMemo(() => new Date().getTime(), []);
  const urgency = dueUrgency(activity.dueDate, now);
  const typeMeta = ACTIVITY_TYPES[activity.type];
  const TypeIcon = typeMeta.Icon;
  const isProject = activity.type === "PROJECT";
  // Proyecto: historial de entregas (la más reciente primero).
  const deliveries = sub?.deliveries ?? [];

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removingFile, startRemoveFile] = useTransition();

  function removeSubmittedFile() {
    startRemoveFile(async () => {
      const result = await removeSubmissionFileAction(courseId, activity.id);
      if (result.ok) {
        toast.success("Archivo borrado");
        setConfirmDelete(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="rounded-xl border bg-background p-3.5">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
            typeMeta.tint,
          )}
          aria-hidden="true"
        >
          <TypeIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{activity.title}</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
              {typeMeta.label}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
                meta.badge,
              )}
            >
              {meta.label}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>Sobre {activity.maxScore}</span>
            {activity.weight > 0 && <span>Peso {activity.weight}%</span>}
          </div>
          {due && urgency && (
            <p
              className={cn(
                "mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
                DUE_URGENCY_CLS[urgency],
              )}
            >
              <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
              <span>
                Fecha y hora límite de entrega:{" "}
                <span className="font-semibold">{due}</span>
                {urgency === "overdue" && " · plazo vencido"}
              </span>
            </p>
          )}
          {activity.instructions && (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {activity.instructions}
            </p>
          )}
        </div>

        {isGraded && sub?.score !== null && sub?.score !== undefined && (
          <span className="flex shrink-0 flex-col items-end">
            <span className="inline-flex items-center gap-1 font-heading text-lg font-bold text-emerald-600 dark:text-emerald-400">
              <Award className="size-4" aria-hidden="true" />
              {sub.score}
            </span>
            <span className="text-[0.65rem] text-muted-foreground">
              de {activity.maxScore}
            </span>
          </span>
        )}
      </div>

      {/* Retroalimentación del docente */}
      {isGraded && sub?.feedback && (
        <p className="mt-2 rounded-lg bg-emerald-500/[0.07] px-3 py-2 text-xs text-foreground/80">
          <span className="font-medium">Retroalimentación: </span>
          {sub.feedback}
        </p>
      )}

      {/* Proyecto: historial de entregas (cada envío es una fila propia) */}
      {isProject && deliveries.length > 0 && (
        <ul className="mt-2 space-y-2">
          {deliveries.map((d, i) => {
            const when = formatDue(d.submittedAt);
            return (
              <li
                key={d.order}
                className="rounded-lg border bg-muted/30 px-3 py-2 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground/90">
                    Entrega #{d.order}
                  </span>
                  {i === 0 && (
                    <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[0.6rem] font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                      Última
                    </span>
                  )}
                  {when && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <CalendarClock className="size-3" />
                      {when}
                    </span>
                  )}
                </div>
                {d.text && (
                  <p className="mt-1 text-foreground/80">{d.text}</p>
                )}
                {d.files.length > 0 && (
                  <ul className="mt-1.5 space-y-1">
                    {d.files.map((f) => (
                      <li key={f.url}>
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sky-600 hover:underline dark:text-sky-400"
                        >
                          <Paperclip className="size-3.5 shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Tarea: entrega única (texto y/o archivo) */}
      {!isProject && sub && (sub.content || sub.fileUrl) && (
        <div className="mt-2 space-y-1.5 text-xs">
          {sub.content && (
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-foreground/80">
              {sub.content}
            </p>
          )}
          {sub.fileUrl && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <a
                href={sub.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sky-600 hover:underline dark:text-sky-400"
              >
                <Download className="size-3.5" />
                Ver mi archivo entregado
              </a>
              {!isGraded && !readOnly && (
                <AlertDialog
                  open={confirmDelete}
                  onOpenChange={(next) => {
                    if (removingFile) return;
                    setConfirmDelete(next);
                  }}
                >
                  <AlertDialogTrigger
                    render={
                      <button
                        type="button"
                        disabled={removingFile}
                        className="inline-flex items-center gap-1.5 text-destructive hover:underline disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                        Borrar archivo entregado
                      </button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogMedia className="bg-destructive/10 text-destructive">
                        <TriangleAlert aria-hidden="true" />
                      </AlertDialogMedia>
                      <AlertDialogTitle>
                        ¿Borrar el archivo entregado?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará el archivo
                        de tu entrega.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={removingFile}>
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        type="button"
                        variant="destructive"
                        disabled={removingFile}
                        onClick={removeSubmittedFile}
                      >
                        {removingFile ? (
                          <>
                            <Loader2
                              className="size-4 animate-spin"
                              aria-hidden="true"
                            />
                            Borrando…
                          </>
                        ) : (
                          <>
                            <Trash2 className="size-4" aria-hidden="true" />
                            Borrar
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
      )}

      {/* Acción de entrega (oculta si ya fue calificada o el módulo concluyó).
          Abre un modal con el formulario de entrega. */}
      {!isGraded && !readOnly && (
        <div className="mt-3">
          {/* Proyecto: cada envío agrega una entrega nueva (no reemplaza). */}
          <Button
            type="button"
            size="sm"
            variant={
              (isProject ? deliveries.length > 0 : Boolean(sub))
                ? "outline"
                : "default"
            }
            onClick={() => setOpen(true)}
          >
            {isProject
              ? deliveries.length > 0
                ? "Nueva entrega"
                : "Entregar"
              : sub
                ? "Editar entrega"
                : "Entregar"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isProject
                    ? deliveries.length > 0
                      ? "Nueva entrega"
                      : "Entregar actividad"
                    : sub
                      ? "Editar entrega"
                      : "Entregar actividad"}
                </DialogTitle>
                <DialogDescription>{activity.title}</DialogDescription>
              </DialogHeader>
              <SubmitForm
                courseId={courseId}
                activityId={activity.id}
                isProject={isProject}
                initialContent={isProject ? "" : (sub?.content ?? "")}
                initialFileUrl={isProject ? "" : (sub?.fileUrl ?? "")}
                initialFiles={[]}
                onDone={() => setOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

function SubmitForm({
  courseId,
  activityId,
  isProject,
  initialContent,
  initialFileUrl,
  initialFiles,
  onDone,
}: {
  courseId: string;
  activityId: string;
  isProject: boolean;
  initialContent: string;
  initialFileUrl: string;
  initialFiles: SubmissionFile[];
  onDone: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(initialContent);
  // Tarea: un archivo (fileUrl). Proyecto: lista de archivos.
  const [fileUrl, setFileUrl] = useState(initialFileUrl);
  const [fileName, setFileName] = useState(
    initialFileUrl ? (initialFileUrl.split("/").pop() ?? "") : "",
  );
  const [files, setFiles] = useState<SubmissionFile[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();

  /** Sube un archivo y devuelve su URL (o null si falla). */
  async function uploadOne(file: File): Promise<SubmissionFile | null> {
    const sizeError = fileSizeError(file, MAX_DOCUMENT_UPLOAD_BYTES);
    if (sizeError) {
      toast.error(sizeError);
      return null;
    }
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/me/upload", { method: "POST", body });
    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      message?: string;
    };
    if (!res.ok || !data.url) {
      toast.error(data.message ?? "No se pudo subir el archivo");
      return null;
    }
    return { name: file.name, url: data.url, size: file.size };
  }

  /** Procesa la selección/arrastre: 1 archivo en Tarea, varios en Proyecto. */
  async function handleFiles(list: FileList) {
    const picked = isProject ? Array.from(list) : list[0] ? [list[0]] : [];
    if (picked.length === 0) return;
    setUploading(true);
    try {
      for (const file of picked) {
        const uploaded = await uploadOne(file);
        if (!uploaded) continue;
        if (isProject) {
          setFiles((prev) => [...prev, uploaded]);
        } else {
          setFileUrl(uploaded.url);
          setFileName(uploaded.name);
        }
      }
    } finally {
      setUploading(false);
    }
  }

  function removeFile(url: string) {
    setFiles((prev) => prev.filter((f) => f.url !== url));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const hasFile = isProject ? files.length > 0 : Boolean(fileUrl);
    if (!content.trim() && !hasFile) {
      toast.error(
        isProject
          ? "Adjunta al menos un archivo o escribe tu entrega"
          : "Adjunta un archivo o escribe tu entrega",
      );
      return;
    }
    startTransition(async () => {
      const result = await submitActivityAction(courseId, activityId, {
        content: content.trim() || null,
        fileUrl: isProject ? null : fileUrl || null,
        files: isProject
          ? files.map((f) => ({ name: f.name, url: f.url, size: f.size }))
          : undefined,
      });
      if (result.ok) {
        toast.success("Entrega enviada");
        onDone();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tu entrega (opcional si adjuntas archivo)…"
        className="min-h-24 bg-background"
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple={isProject}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Proyecto: lista de archivos adjuntos con opción de quitar. */}
      {isProject && files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li
              key={f.url}
              className="flex items-center gap-1 rounded-md border bg-background px-3 py-2"
            >
              <Paperclip className="size-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <span className="min-w-0 flex-1 truncate text-xs">{f.name}</span>
              <button
                type="button"
                aria-label={`Quitar ${f.name}`}
                disabled={uploading}
                onClick={() => removeFile(f.url)}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Tarea: archivo único seleccionado. */}
      {!isProject && fileUrl && (
        <div className="flex items-center gap-1 rounded-md border bg-background px-3 py-2">
          <Paperclip className="size-4 shrink-0 text-sky-600 dark:text-sky-400" />
          <span className="min-w-0 flex-1 truncate text-xs">{fileName}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Cambiar
          </Button>
        </div>
      )}

      {/* Zona de arrastre: arrastrar o hacer clic para seleccionar. */}
      <div
        role="button"
        tabIndex={0}
        aria-label={
          isProject
            ? "Arrastra y suelta archivos aquí, o haz clic para seleccionarlos"
            : "Arrastra y suelta un archivo aquí, o haz clic para seleccionarlo"
        }
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
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
          if (e.dataTransfer.files) void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-12 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          dragOver
            ? "border-primary bg-primary/10 text-primary"
            : (isProject ? files.length > 0 : fileUrl)
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
              {isProject
                ? "Arrastra y suelta tus archivos aquí"
                : fileUrl
                  ? "Arrastra otro archivo para reemplazarlo"
                  : "Arrastra y suelta un archivo aquí"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isProject
                ? "haz clic aquí para seleccionar (puedes adjuntar varios)"
                : "haz clic aquí para seleccionar el archivo"}
            </p>
          </>
        )}
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Tamaño máximo: {MAX_DOCUMENT_UPLOAD_MB} MB por archivo
      </p>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pending || uploading}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Enviar entrega
        </Button>
      </div>
    </form>
  );
}
