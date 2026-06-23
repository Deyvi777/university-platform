"use client";

import { useRef, useState, useTransition } from "react";
import {
  Award,
  CalendarClock,
  Check,
  ClipboardList,
  Download,
  Loader2,
  Paperclip,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ActivityType, CourseActivity, SubmissionStatus } from "@/lib/api/me";
import { cn } from "@/lib/utils";
import { submitActivityAction } from "./actions";

const TYPE_LABEL: Record<ActivityType, string> = {
  ASSIGNMENT: "Tarea",
  QUIZ: "Cuestionario",
  EXAM: "Examen",
  PROJECT: "Proyecto",
  FORUM: "Foro",
};

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
}: {
  courseId: string;
  activity: CourseActivity;
}) {
  const sub = activity.submission;
  const status: SubmissionStatus = sub?.status ?? "PENDING";
  const meta = STATUS_META[status];
  const isGraded = status === "GRADED";
  const due = formatDue(activity.dueDate);

  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-xl border bg-background p-3.5">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
          aria-hidden="true"
        >
          <ClipboardList className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{activity.title}</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
              {TYPE_LABEL[activity.type]}
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
            {due && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3" />
                {due}
              </span>
            )}
          </div>
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

      {/* Entrega actual del estudiante */}
      {sub && (sub.content || sub.fileUrl) && (
        <div className="mt-2 space-y-1.5 text-xs">
          {sub.content && (
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-foreground/80">
              {sub.content}
            </p>
          )}
          {sub.fileUrl && (
            <a
              href={sub.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sky-600 hover:underline dark:text-sky-400"
            >
              <Download className="size-3.5" />
              Ver mi archivo entregado
            </a>
          )}
        </div>
      )}

      {/* Acción de entrega (oculta si ya fue calificada) */}
      {!isGraded && (
        <div className="mt-3">
          {editing ? (
            <SubmitForm
              courseId={courseId}
              activityId={activity.id}
              initialContent={sub?.content ?? ""}
              initialFileUrl={sub?.fileUrl ?? ""}
              onDone={() => setEditing(false)}
            />
          ) : (
            <Button
              type="button"
              size="sm"
              variant={sub ? "outline" : "default"}
              onClick={() => setEditing(true)}
            >
              {sub ? "Editar entrega" : "Entregar"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function SubmitForm({
  courseId,
  activityId,
  initialContent,
  initialFileUrl,
  onDone,
}: {
  courseId: string;
  activityId: string;
  initialContent: string;
  initialFileUrl: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(initialContent);
  const [fileUrl, setFileUrl] = useState(initialFileUrl);
  const [fileName, setFileName] = useState(
    initialFileUrl ? (initialFileUrl.split("/").pop() ?? "") : "",
  );
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/me/upload", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        message?: string;
      };
      if (!res.ok || !data.url) {
        toast.error(data.message ?? "No se pudo subir el archivo");
        return;
      }
      setFileUrl(data.url);
      setFileName(file.name);
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !fileUrl) {
      toast.error("Adjunta un archivo o escribe tu entrega");
      return;
    }
    startTransition(async () => {
      const result = await submitActivityAction(courseId, activityId, {
        content: content.trim() || null,
        fileUrl: fileUrl || null,
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
    <form onSubmit={submit} className="space-y-2.5 rounded-lg border bg-muted/20 p-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tu entrega (opcional si adjuntas archivo)…"
        className="min-h-20 bg-background"
      />
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      {fileUrl ? (
        <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
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
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploading ? "Subiendo…" : "Adjuntar archivo"}
        </Button>
      )}
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
