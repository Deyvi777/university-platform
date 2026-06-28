"use client";

import { useState, useTransition } from "react";
import { Check, Download, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SOCIAL_DEFS } from "@/components/landing/social-defs";
import type { GradingStudentRow } from "@/lib/api/teacher";
import type { SubmissionStatus } from "@/lib/api/me";
import { cn } from "@/lib/utils";
import { gradeSubmissionAction } from "./actions";

const WHATSAPP_PATH =
  SOCIAL_DEFS.find((s) => s.key === "whatsapp")?.path ?? "";

/** Teléfono a formato internacional para `wa.me` (local boliviano → +591). */
function toWaNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("591") ? digits : `591${digits}`;
}

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
  activityTitle,
  maxScore,
  row,
  readOnly = false,
}: {
  activityId: string;
  activityTitle: string;
  maxScore: number;
  row: GradingStudentRow;
  /** Módulo concluido: solo lectura (no se puede calificar). */
  readOnly?: boolean;
}) {
  const router = useRouter();
  const sub = row.submission;
  const status: SubmissionStatus = sub?.status ?? "PENDING";
  const meta = STATUS_META[status];

  const [score, setScore] = useState(
    sub?.score !== null && sub?.score !== undefined ? String(sub.score) : "",
  );
  const [feedback, setFeedback] = useState(sub?.feedback ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const fullName = `${row.student.firstName} ${row.student.lastName}`;
  const waNumber = toWaNumber(row.student.phone);
  // Mensaje de WhatsApp con la nota y la retroalimentación.
  const trimmedFeedback = feedback.trim();
  const waMessage =
    `Hola ${row.student.firstName}, tu calificación en la actividad ` +
    `«${activityTitle}» es ${score}/${maxScore}.` +
    (trimmedFeedback ? `\n\nRetroalimentación: ${trimmedFeedback}` : "");
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`
    : "";

  // Valida y abre el diálogo de confirmación (enviar por WhatsApp o solo guardar).
  function attemptSave() {
    const value = Number(score);
    if (score.trim() === "" || Number.isNaN(value)) {
      toast.error("Ingresa una nota");
      return;
    }
    if (value < 0 || value > maxScore) {
      toast.error(`La nota debe estar entre 0 y ${maxScore}`);
      return;
    }
    setConfirmOpen(true);
  }

  function doSave() {
    const value = Number(score);
    startTransition(async () => {
      const result = await gradeSubmissionAction(activityId, row.student.id, {
        score: value,
        feedback: trimmedFeedback || null,
      });
      if (result.ok) {
        toast.success("Calificación guardada");
        setConfirmOpen(false);
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

      {/* Calificación: solo lectura cuando el módulo está concluido. */}
      {readOnly ? (
        <div className="mt-3 rounded-xl bg-muted/30 p-3 text-sm">
          <p>
            <span className="text-muted-foreground">Nota: </span>
            <span className="font-semibold tabular-nums">
              {sub?.score !== null && sub?.score !== undefined
                ? `${sub.score} / ${maxScore}`
                : "Sin calificar"}
            </span>
          </p>
          {sub?.feedback && (
            <p className="mt-1 text-xs text-foreground/80">
              <span className="text-muted-foreground">Retroalimentación: </span>
              {sub.feedback}
            </p>
          )}
        </div>
      ) : (
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
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={attemptSave}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Guardar
        </Button>
      </div>
      )}

      {/* Confirmación: enviar la nota + retroalimentación por WhatsApp o solo guardar */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Guardar calificación</DialogTitle>
            <DialogDescription>
              ¿Quieres enviar la nota y la retroalimentación a{" "}
              <span className="font-medium text-foreground">{fullName}</span> por
              WhatsApp?
            </DialogDescription>
          </DialogHeader>

          {/* Vista previa del mensaje */}
          <div className="rounded-xl border bg-muted/30 p-3 text-sm whitespace-pre-line text-foreground/90">
            {waMessage}
          </div>

          {!waNumber && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Este estudiante no tiene un teléfono registrado, así que solo se
              podrá guardar.
            </p>
          )}

          <div className="mt-1 flex flex-col items-stretch gap-2 sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirmOpen(false)}
              className="h-auto min-h-12 whitespace-normal px-4 py-2 text-sm leading-tight"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={doSave}
              className="h-auto min-h-12 flex-1 whitespace-normal px-4 py-2 text-center text-sm leading-tight"
            >
              <Save className="size-5" />
              No enviar, solo guardar
            </Button>
            {waNumber && (
              <Button
                nativeButton={false}
                className="h-auto min-h-12 flex-1 whitespace-normal bg-green-600 px-4 py-2 text-center text-sm leading-tight text-white hover:bg-green-700 focus-visible:ring-green-600/40 dark:bg-green-600 dark:hover:bg-green-700"
                render={
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={doSave}
                  />
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5"
                  aria-hidden="true"
                >
                  <path d={WHATSAPP_PATH} />
                </svg>
                Enviar y guardar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </li>
  );
}
