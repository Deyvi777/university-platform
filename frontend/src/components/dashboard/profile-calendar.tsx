"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  PartyPopper,
  Pencil,
  Plus,
  Presentation,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { holidayMap } from "@/lib/bolivia-holidays";
import { cn } from "@/lib/utils";

// ---- Tipos del overview del backend ----
interface Deadline {
  contentId: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  moduleId: string;
  moduleName: string;
  moduleOrder: number;
  courseId: string;
  courseName: string;
}
interface Reminder {
  id: string;
  date: string; // YYYY-MM-DD
  note: string;
}
interface ClassItem {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string | null;
  title: string | null;
  location: string | null;
  moduleId: string;
  moduleName: string;
  moduleOrder: number;
  courseId: string;
  courseName: string;
}
interface Overview {
  deadlines: Deadline[];
  reminders: Reminder[];
  classes?: ClassItem[];
}

const WEEKDAYS = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function keyOf(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
/** Lunes=0 … Domingo=6 (semana iniciando en lunes). */
function mondayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/** Construye la matriz de semanas del mes (incluye días vecinos para rellenar). */
function buildWeeks(year: number, month: number) {
  const first = new Date(year, month, 1);
  const lead = mondayIndex(first.getDay());
  const start = new Date(year, month, 1 - lead);
  const weeks: {
    y: number;
    m: number;
    d: number;
    key: string;
    inMonth: boolean;
  }[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < 6; w++) {
    const row: (typeof weeks)[number] = [];
    for (let i = 0; i < 7; i++) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth();
      const d = cursor.getDate();
      row.push({ y, m, d, key: keyOf(y, m, d), inMonth: m === month });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(row);
  }
  return weeks;
}

function prettyDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const wd = date.toLocaleDateString("es-BO", { weekday: "long" });
  return `${wd}, ${d} de ${MONTHS[m - 1]}`;
}

export function ProfileCalendar({
  role,
  variant = "compact",
}: {
  role?: string;
  variant?: "compact" | "expanded";
}) {
  const expanded = variant === "expanded";
  const qc = useQueryClient();
  const today = useMemo(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth(), d: n.getDate() };
  }, []);
  const todayKey = keyOf(today.y, today.m, today.d);

  const [view, setView] = useState({ y: today.y, m: today.m });
  const [selected, setSelected] = useState<string>(todayKey);
  const [draft, setDraft] = useState("");
  // Edición inline de un recordatorio existente.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const { data, isLoading } = useQuery<Overview>({
    queryKey: ["me-calendar"],
    queryFn: async () => {
      const res = await fetch("/api/me/calendar/overview");
      if (!res.ok) throw new Error("No se pudo cargar el calendario");
      return res.json();
    },
    staleTime: 60_000,
  });

  const holidays = useMemo(
    () => holidayMap([view.y - 1, view.y, view.y + 1]),
    [view.y],
  );

  const remindersByDate = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    for (const r of data?.reminders ?? []) {
      const arr = map.get(r.date) ?? [];
      arr.push(r);
      map.set(r.date, arr);
    }
    return map;
  }, [data]);

  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, Deadline[]>();
    for (const dl of data?.deadlines ?? []) {
      const arr = map.get(dl.dueDate) ?? [];
      arr.push(dl);
      map.set(dl.dueDate, arr);
    }
    return map;
  }, [data]);

  const classesByDate = useMemo(() => {
    const map = new Map<string, ClassItem[]>();
    for (const c of data?.classes ?? []) {
      const arr = map.get(c.date) ?? [];
      arr.push(c);
      map.set(c.date, arr);
    }
    return map;
  }, [data]);

  const weeks = useMemo(() => buildWeeks(view.y, view.m), [view]);

  const createMut = useMutation({
    mutationFn: async (vars: { date: string; note: string }) => {
      const res = await fetch("/api/me/calendar/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) throw new Error("No se pudo guardar el recordatorio");
      return res.json();
    },
    onSuccess: () => {
      setDraft("");
      toast.success("Recordatorio guardado");
      qc.invalidateQueries({ queryKey: ["me-calendar"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (vars: { id: string; note: string }) => {
      const res = await fetch(`/api/me/calendar/reminders/${vars.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: vars.note }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar el recordatorio");
      return res.json();
    },
    onSuccess: () => {
      setEditingId(null);
      setEditDraft("");
      toast.success("Recordatorio actualizado");
      qc.invalidateQueries({ queryKey: ["me-calendar"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/me/calendar/reminders/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Recordatorio eliminado");
      qc.invalidateQueries({ queryKey: ["me-calendar"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startEdit(id: string, note: string) {
    setEditingId(id);
    setEditDraft(note);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }
  function saveEdit() {
    const note = editDraft.trim();
    if (!note || !editingId) return;
    updateMut.mutate({ id: editingId, note });
  }

  function goMonth(delta: number) {
    setView((v) => {
      const m = v.m + delta;
      const y = v.y + Math.floor(m / 12);
      return { y, m: ((m % 12) + 12) % 12 };
    });
  }
  function goToday() {
    setView({ y: today.y, m: today.m });
    setSelected(todayKey);
  }

  const selHoliday = holidays.get(selected);
  const selDeadlines = deadlinesByDate.get(selected) ?? [];
  const selReminders = remindersByDate.get(selected) ?? [];
  const selClasses = classesByDate.get(selected) ?? [];

  function deadlineHref(dl: Deadline): string {
    return role === "STUDENT"
      ? `/dashboard/aula/${dl.moduleId}?content=${dl.contentId}`
      : `/dashboard/modulos/${dl.moduleId}`;
  }

  function classHref(c: ClassItem): string {
    return role === "STUDENT"
      ? `/dashboard/aula/${c.moduleId}`
      : `/dashboard/modulos/${c.moduleId}`;
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border bg-card shadow-sm",
        expanded ? "p-4 sm:p-6" : "p-4",
      )}
    >
      {/* Encabezado del mes */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3
          className={cn(
            "flex items-center gap-2 font-heading font-bold tracking-tight capitalize",
            expanded ? "text-xl sm:text-2xl" : "text-sm",
          )}
        >
          <CalendarDays
            className={cn("text-primary", expanded ? "size-6" : "size-4")}
            aria-hidden="true"
          />
          {MONTHS[view.m]} {view.y}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToday}
            className={cn(
              "rounded-full font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              expanded ? "px-4 py-2 text-sm" : "px-2.5 py-1 text-xs",
            )}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => goMonth(-1)}
            aria-label="Mes anterior"
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              expanded ? "size-9" : "size-7",
            )}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => goMonth(1)}
            aria-label="Mes siguiente"
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              expanded ? "size-9" : "size-7",
            )}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          expanded &&
            "mt-6 grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_22rem]",
        )}
      >
        <div className="min-w-0">
          {/* Cabecera de días de la semana */}
          <div
            className={cn(
              "grid grid-cols-7 text-center font-medium uppercase text-muted-foreground/70",
              expanded
                ? "gap-1 border-b pb-2 text-xs sm:gap-2"
                : "mt-3 gap-1 text-[11px]",
            )}
          >
            {WEEKDAYS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          {/* Cuadrícula del mes */}
          <div
            className={cn(
              "mt-1 grid grid-cols-7",
              expanded ? "gap-1 sm:gap-2" : "gap-1",
            )}
          >
            {weeks.flat().map((cell) => {
              const isToday = cell.key === todayKey;
              const isSelected = cell.key === selected;
              const isHoliday = holidays.has(cell.key);
              const hasDeadline = deadlinesByDate.has(cell.key);
              const hasReminder = remindersByDate.has(cell.key);
              const hasClass = classesByDate.has(cell.key);
              const cellHoliday = holidays.get(cell.key);
              const cellClasses = classesByDate.get(cell.key) ?? [];
              const cellDeadlines = deadlinesByDate.get(cell.key) ?? [];
              const cellReminders = remindersByDate.get(cell.key) ?? [];
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelected(cell.key)}
                  className={cn(
                    "relative flex flex-col rounded-lg text-sm tabular-nums transition-all",
                    expanded
                      ? "min-h-20 items-start justify-start overflow-hidden border border-transparent p-1.5 text-left hover:-translate-y-0.5 hover:border-border hover:shadow-sm sm:min-h-28 sm:p-2"
                      : "h-9 items-center justify-center",
                    !cell.inMonth && "text-muted-foreground/35",
                    cell.inMonth && !isToday && "hover:bg-muted",
                    cell.inMonth &&
                      isHoliday &&
                      !isToday &&
                      "font-semibold text-red-600 dark:text-red-300",
                    isToday && "bg-primary font-bold text-primary-foreground",
                    isSelected && !isToday && "ring-2 ring-primary/50",
                    expanded &&
                      isSelected &&
                      !isToday &&
                      "bg-primary/5 shadow-sm",
                  )}
                >
                  <span
                    className={cn(
                      expanded &&
                        "flex size-6 items-center justify-center rounded-full font-semibold sm:size-7",
                      expanded && isToday && "bg-primary-foreground/15",
                    )}
                  >
                    {cell.d}
                  </span>
                  {/* Indicadores */}
                  {(isHoliday || hasDeadline || hasReminder || hasClass) && (
                    <span
                      className={cn(
                        "absolute bottom-1 flex items-center gap-0.5",
                        expanded && "sm:hidden",
                      )}
                    >
                      {isHoliday && (
                        <span
                          className={cn(
                            "size-1 rounded-full",
                            isToday ? "bg-primary-foreground" : "bg-red-500",
                          )}
                        />
                      )}
                      {hasClass && (
                        <span
                          className={cn(
                            "size-1 rounded-full",
                            isToday ? "bg-primary-foreground" : "bg-sky-500",
                          )}
                        />
                      )}
                      {hasDeadline && (
                        <span
                          className={cn(
                            "size-1 rounded-full",
                            isToday ? "bg-primary-foreground" : "bg-amber-500",
                          )}
                        />
                      )}
                      {hasReminder && (
                        <span
                          className={cn(
                            "size-1 rounded-full",
                            isToday ? "bg-primary-foreground" : "bg-violet-500",
                          )}
                        />
                      )}
                    </span>
                  )}
                  {expanded && cell.inMonth && (
                    <span className="mt-1 hidden w-full space-y-1 sm:block">
                      {cellHoliday && (
                        <span className="block truncate rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-red-700 dark:text-red-300">
                          {cellHoliday}
                        </span>
                      )}
                      {cellClasses.slice(0, 1).map((item) => (
                        <span
                          key={item.id}
                          className="block truncate rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-sky-700 dark:text-sky-300"
                        >
                          {item.startTime} · {item.title || "Clase"}
                        </span>
                      ))}
                      {cellDeadlines.slice(0, 1).map((item) => (
                        <span
                          key={item.contentId}
                          className="block truncate rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-amber-700 dark:text-amber-300"
                        >
                          Entrega · {item.title}
                        </span>
                      ))}
                      {cellReminders.slice(0, 1).map((item) => (
                        <span
                          key={item.id}
                          className="block truncate rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-violet-700 dark:text-violet-300"
                        >
                          {item.note}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div
            className={cn(
              "mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground",
              expanded ? "text-xs" : "text-[11px]",
            )}
          >
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-red-500" /> Feriado
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-sky-500" /> Clase
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-amber-500" /> Entrega
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-violet-500" />{" "}
              Recordatorio
            </span>
          </div>
        </div>

        {/* Detalle de la fecha seleccionada */}
        <div
          className={cn(
            "border-t pt-4",
            expanded
              ? "mt-5 rounded-2xl border bg-muted/20 p-4 2xl:mt-0 2xl:border-t 2xl:p-5"
              : "mt-4",
          )}
        >
          {expanded && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Agenda del día
            </p>
          )}
          <p
            className={cn(
              "font-semibold capitalize",
              expanded ? "text-lg" : "text-sm",
            )}
          >
            {prettyDate(selected)}
          </p>

          {isLoading && (
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Cargando…
            </p>
          )}

          {selHoliday && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs text-red-700 dark:text-red-300">
              <PartyPopper
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              <span className="font-medium">{selHoliday}</span>
            </div>
          )}

          {selClasses.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {selClasses.map((c) => (
                <li key={c.id}>
                  <Link
                    href={classHref(c)}
                    className="flex items-start gap-2 rounded-lg bg-sky-500/10 px-2.5 py-1.5 text-xs text-sky-800 transition-colors hover:bg-sky-500/20 dark:text-sky-200"
                  >
                    <Presentation
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium tabular-nums">
                        Clase {c.startTime}
                        {c.endTime ? ` – ${c.endTime}` : ""}
                        {c.title ? ` · ${c.title}` : ""}
                      </span>
                      <span className="block truncate text-sky-700/80 dark:text-sky-300/70">
                        {c.courseName} · Módulo {c.moduleOrder}
                      </span>
                      {c.location && (
                        <span className="mt-0.5 flex items-center gap-1 text-sky-700/80 dark:text-sky-300/70">
                          <MapPin
                            className="size-3 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">{c.location}</span>
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {selDeadlines.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {selDeadlines.map((dl) => (
                <li key={dl.contentId}>
                  <Link
                    href={deadlineHref(dl)}
                    className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-800 transition-colors hover:bg-amber-500/20 dark:text-amber-200"
                  >
                    <Clock
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium">{dl.title}</span>
                      <span className="block truncate text-amber-700/80 dark:text-amber-300/70">
                        {dl.courseName}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {selReminders.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {selReminders.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start gap-2 rounded-lg bg-violet-500/10 px-2.5 py-1.5 text-xs text-violet-800 dark:text-violet-200"
                >
                  <StickyNote
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  {editingId === r.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveEdit();
                      }}
                      className="flex min-w-0 flex-1 items-start gap-1.5"
                    >
                      <input
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        maxLength={500}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="min-w-0 flex-1 rounded-md border border-violet-400/40 bg-background px-2 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
                      />
                      <button
                        type="submit"
                        disabled={updateMut.isPending || !editDraft.trim()}
                        aria-label="Guardar cambios"
                        className="shrink-0 rounded-md p-0.5 text-emerald-600 transition-colors hover:bg-emerald-500/15 disabled:opacity-50 dark:text-emerald-400"
                      >
                        {updateMut.isPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        aria-label="Cancelar edición"
                        className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                        {r.note}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(r.id, r.note)}
                        aria-label="Editar recordatorio"
                        className="shrink-0 rounded-md p-0.5 text-violet-500/70 transition-colors hover:bg-violet-500/20 hover:text-violet-700 dark:hover:text-violet-200"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMut.mutate(r.id)}
                        disabled={deleteMut.isPending}
                        aria-label="Eliminar recordatorio"
                        className="shrink-0 rounded-md p-0.5 text-violet-500/70 transition-colors hover:bg-violet-500/20 hover:text-red-600"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!isLoading &&
            !selHoliday &&
            selClasses.length === 0 &&
            selDeadlines.length === 0 &&
            selReminders.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Sin eventos. Agrega un recordatorio para esta fecha.
              </p>
            )}

          {/* Agregar recordatorio */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const note = draft.trim();
              if (!note) return;
              createMut.mutate({ date: selected, note });
            }}
            className="mt-3 flex items-start gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              placeholder="Nuevo apunte o recordatorio…"
              className="min-w-0 flex-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <button
              type="submit"
              disabled={createMut.isPending || !draft.trim()}
              aria-label="Agregar recordatorio"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {createMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
