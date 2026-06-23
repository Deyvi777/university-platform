"use client";

import { useState, useTransition } from "react";
import { Check, Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { GradingStudentRow } from "@/lib/api/teacher";
import type { SubmissionStatus } from "@/lib/api/me";
import { cn } from "@/lib/utils";
import { gradeSubmissionAction } from "./actions";

const STATUS_META: Record<SubmissionStatus, { label: string; badge: string }> = {
  PENDING: { label: "Sin entregar", badge: "bg-muted text-muted-foreground" },
  SUBMITTED: {
    label: "Entregada",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
  LATE: {
    label: "Tarde",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  GRADED: {
    label: "Calificada",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
};

export function GradingRow({
  activityId,
  maxScore,
  row,
}: {
  activityId: string;
  maxScore: number;
  row: GradingStudentRow;
}) {
  const router = useRouter();
  const sub = row.submission;
  const status: SubmissionStatus = sub?.status ?? "PENDING";
  const meta = STATUS_META[status];

  const [score, setScore] = useState(
    sub?.score !== null && sub?.score !== undefined ? String(sub.score) : "",
  );
  const [feedback, setFeedback] = useState(sub?.feedback ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    const value = Number(score);
    if (score.trim() === "" || Number.isNaN(value)) {
      toast.error("Ingresa una nota");
      return;
    }
    if (value < 0 || value > maxScore) {
      toast.error(`La nota debe estar entre 0 y ${maxScore}`);
      return;
    }
    startTransition(async () => {
      const result = await gradeSubmissionAction(activityId, row.student.id, {
        score: value,
        feedback: feedback.trim() || null,
      });
      if (result.ok) {
        toast.success("Calificación guardada");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <li className="rounded-2xl border bg-card p-4 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-9 items-center justify-center rounded-full bg-blue-950 text-[0.7rem] font-bold text-amber-300"
            aria-hidden="true"
          >
            {`${row.student.firstName} ${row.student.lastName}`
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() ?? "")
              .join("")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {row.student.firstName} {row.student.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.student.email}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            meta.badge,
          )}
        >
          {meta.label}
        </span>
      </div>

      {/* Entrega del estudiante */}
      {sub && (sub.content || sub.fileUrl) ? (
        <div className="mt-3 space-y-1.5 rounded-xl bg-muted/30 p-3 text-xs">
          {sub.content && <p className="text-foreground/80">{sub.content}</p>}
          {sub.fileUrl && (
            <a
              href={sub.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-sky-600 hover:underline dark:text-sky-400"
            >
              <Download className="size-3.5" />
              Ver archivo entregado
            </a>
          )}
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          El estudiante aún no ha entregado. Puedes calificar de todos modos.
        </p>
      )}

      {/* Calificación */}
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="w-28">
          <label
            htmlFor={`score-${row.student.id}`}
            className="text-xs font-medium text-muted-foreground"
          >
            Nota / {maxScore}
          </label>
          <Input
            id={`score-${row.student.id}`}
            type="number"
            min={0}
            max={maxScore}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="min-w-0 flex-1">
          <label
            htmlFor={`fb-${row.student.id}`}
            className="text-xs font-medium text-muted-foreground"
          >
            Retroalimentación (opcional)
          </label>
          <Textarea
            id={`fb-${row.student.id}`}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Comentario para el estudiante…"
            className="mt-1 min-h-10"
          />
        </div>
        <Button type="button" size="sm" disabled={pending} onClick={save}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Guardar
        </Button>
      </div>
    </li>
  );
}
