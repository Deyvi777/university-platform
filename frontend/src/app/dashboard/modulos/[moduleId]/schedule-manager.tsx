"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  Loader2,
  MapPin,
  Pencil,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  localDateKey,
  prettySessionDate,
  sessionTimeRange,
} from "@/components/dashboard/class-schedule";
import type { ClassSession } from "@/lib/api/teacher";
import { cn } from "@/lib/utils";
import {
  createSessionAction,
  deleteSessionAction,
  updateSessionAction,
  type ClassSessionPayload,
} from "./actions";

interface FormState {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  location: string;
}

const EMPTY_FORM: FormState = {
  date: "",
  startTime: "",
  endTime: "",
  title: "",
  location: "",
};

/**
 * Cronograma de clases del módulo (pestaña del workspace del docente): lista de
 * clases con fecha/hora/tema/lugar + alta y edición en un modal. El estudiante
 * ve este cronograma en el aula y ambos roles en su calendario del panel.
 */
export function ScheduleManager({
  moduleId,
  sessions,
  readOnly = false,
}: {
  moduleId: string;
  sessions: ClassSession[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  // `null` = creando; con valor = editando esa clase.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const today = useMemo(() => localDateKey(new Date()), []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, date: today });
    setOpen(true);
  }

  function openEdit(s: ClassSession) {
    setEditingId(s.id);
    setForm({
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime ?? "",
      title: s.title ?? "",
      location: s.location ?? "",
    });
    setOpen(true);
  }

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date || !form.startTime) {
      toast.error("La fecha y la hora de inicio son obligatorias");
      return;
    }
    if (form.endTime && form.endTime <= form.startTime) {
      toast.error("La hora de fin debe ser posterior a la de inicio");
      return;
    }
    const payload: ClassSessionPayload = {
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime || null,
      title: form.title.trim() || null,
      location: form.location.trim() || null,
    };
    startTransition(async () => {
      const result = editingId
        ? await updateSessionAction(moduleId, editingId, payload)
        : await createSessionAction(moduleId, payload);
      if (result.ok) {
        toast.success(editingId ? "Clase actualizada" : "Clase agregada");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold tracking-tight">
            Cronograma de clases
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Las clases que agregues aquí aparecen en el aula del estudiante y en
            el calendario de ambos.
          </p>
        </div>
        {!readOnly && (
          <Button type="button" onClick={openCreate}>
            <CalendarPlus className="size-4" aria-hidden="true" />
            Agregar clase
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
          <span
            className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <CalendarDays className="size-6" />
          </span>
          <p className="mt-3 text-sm font-medium text-foreground">
            Aún no hay clases programadas
          </p>
          {!readOnly && (
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Agrega las fechas y horarios de las clases del módulo para que los
              estudiantes las vean en su aula y su calendario.
            </p>
          )}
        </div>
      ) : (
        <ol className="mt-5 space-y-2">
          {sessions.map((s, i) => {
            const past = s.date < today;
            return (
              <li
                key={s.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm shadow-blue-950/[0.04] dark:shadow-none",
                  past && "opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                    past
                      ? "bg-muted text-muted-foreground"
                      : "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
                  )}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold capitalize">
                    {prettySessionDate(s.date)}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {sessionTimeRange(s)}
                    </span>
                    {s.location && (
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{s.location}</span>
                      </span>
                    )}
                  </p>
                  {s.title && (
                    <p className="mt-0.5 truncate text-sm text-foreground/80">
                      {s.title}
                    </p>
                  )}
                </div>
                {past && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Realizada
                  </span>
                )}
                {!readOnly && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(s)}
                      aria-label="Editar clase"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <DeleteButton
                      action={deleteSessionAction.bind(null, moduleId, s.id)}
                      title="¿Eliminar esta clase?"
                      confirmMessage={`Se eliminará la clase del ${prettySessionDate(s.date)} del cronograma.`}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (pending) return;
          setOpen(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar clase" : "Agregar clase"}
            </DialogTitle>
            <DialogDescription>
              Fecha y horario de la clase. El tema y el lugar (aula o enlace)
              son opcionales.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="session-date">Fecha</Label>
                <Input
                  id="session-date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="session-start">Hora inicio</Label>
                <Input
                  id="session-start"
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="session-end">
                  Hora fin{" "}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </Label>
                <Input
                  id="session-end"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="session-title">
                Tema de la clase{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              <Input
                id="session-title"
                maxLength={200}
                placeholder="Ej. Clase 3: Marco teórico"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="session-location">
                Lugar o enlace{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              <Input
                id="session-location"
                maxLength={300}
                placeholder="Ej. Aula 204 o enlace de Zoom/Meet"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {editingId ? "Guardar cambios" : "Agregar clase"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
