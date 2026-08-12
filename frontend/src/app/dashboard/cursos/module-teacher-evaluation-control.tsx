"use client";

import { Loader2, MessageSquareMore } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setTeacherEvaluationEnabledAction } from "./actions";

export function ModuleTeacherEvaluationControl({
  courseId,
  moduleId,
  enabled,
}: {
  courseId: string;
  moduleId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    const result = await setTeacherEvaluationEnabledAction(
      courseId,
      moduleId,
      !enabled,
    );
    setPending(false);
    if (result.ok) {
      toast.success(
        enabled ? "Evaluación docente desactivada" : "Evaluación docente activada",
      );
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          <MessageSquareMore className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium">Evaluación docente</p>
          <p className="text-xs text-muted-foreground">
            Disponible para estudiantes cuando el módulo esté concluido.
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={pending}
        onClick={toggle}
        className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
      >
        {pending && <Loader2 className="size-3.5 animate-spin" />}
        <span
          className={`relative h-5 w-9 rounded-full transition-colors ${
            enabled ? "bg-emerald-500" : "bg-muted-foreground/30"
          }`}
          aria-hidden="true"
        >
          <span
            className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${
              enabled ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </span>
        {enabled ? "Activada" : "Desactivada"}
      </button>
    </div>
  );
}
