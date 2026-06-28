"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setModuleStatusAction } from "@/app/dashboard/cursos/actions";
import { cn } from "@/lib/utils";

type Status = "DRAFT" | "ACTIVE" | "FINISHED";

const LABELS: Record<Status, string> = {
  ACTIVE: "Activo",
  FINISHED: "Concluido",
  DRAFT: "Borrador",
};

// Orden de presentación: el estado por defecto (Activo) primero.
const ORDER: Status[] = ["ACTIVE", "FINISHED", "DRAFT"];

// Color del estado seleccionado (resalta cuál está activo): verde Activo, azul
// Concluido, ámbar Borrador.
const SELECTED_CLS: Record<Status, string> = {
  ACTIVE: "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500",
  FINISHED: "bg-sky-600 text-white shadow-sm dark:bg-sky-500",
  DRAFT: "bg-amber-500 text-white shadow-sm dark:bg-amber-500",
};

/**
 * Control de estado de un módulo (lo fija el admin manualmente). Guarda al
 * instante con un control segmentado: Activo / Concluido / Borrador.
 */
export function ModuleStatusControl({
  courseId,
  moduleId,
  status,
}: {
  courseId: string;
  moduleId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const current: Status = (
    ORDER.includes(status as Status) ? status : "ACTIVE"
  ) as Status;

  async function change(next: Status) {
    if (next === current || pending) return;
    setPending(true);
    const result = await setModuleStatusAction(courseId, moduleId, next);
    setPending(false);
    if (result.ok) {
      toast.success("Estado del módulo actualizado");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
        Estado
      </span>
      <div
        role="group"
        aria-label="Estado del módulo"
        className="inline-flex rounded-lg border bg-muted/40 p-0.5"
      >
        {ORDER.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending}
            aria-pressed={current === s}
            onClick={() => change(s)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              current === s
                ? SELECTED_CLS[s]
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LABELS[s]}
          </button>
        ))}
      </div>
      {pending && (
        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
