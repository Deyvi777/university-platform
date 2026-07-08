"use client";

import { useId, useMemo, useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Loader2,
  MessageSquarePlus,
  Pencil,
  Plus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DeleteButton } from "@/components/admin/delete-button";
import { WhatsAppButton } from "@/app/dashboard/usuarios/whatsapp-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  GradebookActivity,
  GradebookRow,
  ModuleGradebook,
} from "@/lib/api/teacher";
import type { ModuleGradeStatus } from "@/lib/api/me";
import { cn } from "@/lib/utils";
import {
  createContentAction,
  deleteContentAction,
  gradeStudentAction,
  setObservationAction,
  updateContentAction,
} from "./actions";

const GRADE_STATUS: Record<ModuleGradeStatus, { label: string; cls: string }> = {
  IN_PROGRESS: {
    label: "En curso",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  PASSED: {
    label: "Aprobado",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  FAILED: {
    label: "Reprobado",
    cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
};

// Clave de ordenamiento: "name", "module" o el id de una actividad (columna).
type SortDir = "asc" | "desc";

function studentName(row: GradebookRow): string {
  return `${row.student.lastName} ${row.student.firstName}`;
}

/** Metadato de la columna de una actividad ("/100 · 40%", "/100 · Recuperatorio"). */
function activityColumnMeta(a: GradebookActivity): string {
  if (a.recoveryStage) {
    return `/${a.maxScore} · ${
      a.recoveryStage === "SEGUNDA_INSTANCIA" ? "2.ª instancia" : "Recuperatorio"
    }`;
  }
  return `/${a.maxScore}${a.weight ? ` · ${a.weight}%` : ""}`;
}

// Valor numérico de una fila para una columna de nota (actividad o módulo).
// `null` (sin nota) se ordena siempre al final.
function numericValue(row: GradebookRow, key: string): number | null {
  if (key === "module") return row.moduleGrade?.finalScore ?? null;
  return row.grades.find((g) => g.activityId === key)?.score ?? null;
}

/** Encabezado de columna ordenable: etiqueta + indicador de orden. */
function SortHeaderButton({
  active,
  dir,
  onClick,
  label,
  children,
  className,
}: {
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ordenar por ${label}`}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1 py-0.5 align-middle transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active && "text-foreground",
        className,
      )}
    >
      {children}
      {!active ? (
        <ChevronsUpDown
          className="size-3.5 shrink-0 opacity-60"
          aria-hidden="true"
        />
      ) : dir === "asc" ? (
        <ChevronUp className="size-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}

export function Gradebook({
  moduleId,
  gradebook,
  readOnly = false,
}: {
  moduleId: string;
  gradebook: ModuleGradebook | null;
  /** Módulo concluido: la libreta queda en solo lectura. */
  readOnly?: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [exporting, setExporting] = useState(false);

  function toggleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const students = useMemo(() => {
    const rows = gradebook ? [...gradebook.students] : [];
    rows.sort((a, b) => {
      if (sortKey === "name") {
        const cmp = studentName(a).localeCompare(studentName(b), "es");
        return sortDir === "asc" ? cmp : -cmp;
      }
      const va = numericValue(a, sortKey);
      const vb = numericValue(b, sortKey);
      if (va === null && vb === null) return 0;
      if (va === null) return 1; // sin nota: siempre al final
      if (vb === null) return -1;
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return rows;
  }, [gradebook, sortKey, sortDir]);

  // Exporta la libreta (con el orden visible) a un .xlsx generado en el
  // navegador con SheetJS (import dinámico: la librería solo se carga al usarla).
  async function downloadExcel() {
    if (!gradebook || exporting) return;
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const header = [
        "N°",
        "Estudiante",
        "Correo",
        ...gradebook.activities.map(
          (a) => `${a.title} (${activityColumnMeta(a)})`,
        ),
        "Nota del módulo",
        "Estado",
        "Observación",
      ];
      const rows = students.map((row, i) => {
        const status = row.moduleGrade
          ? readOnly
            ? GRADE_STATUS[row.moduleGrade.status].label
            : "En curso"
          : "Sin nota";
        return [
          i + 1,
          studentName(row),
          row.student.email,
          ...gradebook.activities.map(
            (a) => row.grades.find((g) => g.activityId === a.id)?.score ?? "",
          ),
          row.moduleGrade?.finalScore ?? "",
          status,
          row.observation || "",
        ];
      });
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      ws["!cols"] = header.map((h, idx) => ({
        wch:
          idx === 1 || idx === 2
            ? 32
            : Math.max(10, Math.min(String(h).length + 2, 28)),
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Calificaciones");
      const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, "-");
      XLSX.writeFile(
        wb,
        `Calificaciones - ${safe(gradebook.course.name)} - Módulo ${gradebook.module.order}.xlsx`,
      );
    } catch {
      toast.error("No se pudo generar el Excel");
    } finally {
      setExporting(false);
    }
  }

  if (!gradebook) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
        No se pudo cargar la libreta de calificaciones.
      </div>
    );
  }

  const { activities } = gradebook;

  return (
    <section className="rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
        <div>
          <h2 className="font-heading text-base font-semibold">
            Libreta de calificaciones
          </h2>
          <p className="text-xs text-muted-foreground">
            {readOnly
              ? "Módulo concluido: las calificaciones son solo de lectura."
              : "Notas por actividad, nota del módulo (calculada) y tu observación. Puedes agregar actividades y calificarlas a mano aquí."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {students.length > 0 && (
            <>
              <a
                href={`/libreta-pdf/${moduleId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                <Download className="size-4" aria-hidden="true" /> PDF
              </a>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadExcel}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <FileSpreadsheet className="size-4" aria-hidden="true" />
                )}
                Excel
              </Button>
            </>
          )}
          {!readOnly && (
            <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" /> Nueva calificación
            </Button>
          )}
        </div>
      </div>

      {!readOnly && (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nueva calificación</DialogTitle>
              <DialogDescription>
                Crea una columna de calificación para el módulo y luego carga el
                puntaje de cada estudiante.
              </DialogDescription>
            </DialogHeader>
            <NewActivityForm
              moduleId={moduleId}
              onDone={() => setAddOpen(false)}
              onCancel={() => setAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {students.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <span
            className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <Users className="size-6" />
          </span>
          <p className="mt-3 text-sm font-medium text-foreground">
            No hay estudiantes inscritos
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Cuando el administrador inscriba estudiantes en el programa,
            aparecerán aquí con sus calificaciones.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left">
                <th className="sticky left-0 z-10 bg-muted/30 px-4 py-2.5 font-medium text-muted-foreground">
                  <SortHeaderButton
                    active={sortKey === "name"}
                    dir={sortDir}
                    onClick={() => toggleSort("name")}
                    label="nombre del estudiante"
                    className="-ml-1"
                  >
                    Estudiante
                  </SortHeaderButton>
                </th>
                {activities.map((a) => (
                  <ActivityHeader
                    key={a.id}
                    moduleId={moduleId}
                    activity={a}
                    readOnly={readOnly}
                    active={sortKey === a.id}
                    dir={sortDir}
                    onSort={() => toggleSort(a.id)}
                  />
                ))}
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">
                  <SortHeaderButton
                    active={sortKey === "module"}
                    dir={sortDir}
                    onClick={() => toggleSort("module")}
                    label="nota del módulo"
                  >
                    Módulo
                  </SortHeaderButton>
                </th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                  Observación
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((row) => (
                <StudentRow
                  key={row.student.id}
                  moduleId={moduleId}
                  row={row}
                  activities={activities}
                  readOnly={readOnly}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ActivityHeader({
  moduleId,
  activity,
  readOnly,
  active,
  dir,
  onSort,
}: {
  moduleId: string;
  activity: GradebookActivity;
  readOnly: boolean;
  active: boolean;
  dir: SortDir;
  onSort: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <th
      className="px-3 py-2.5 text-center font-medium text-muted-foreground"
      title={activity.title}
    >
      <SortHeaderButton
        active={active}
        dir={dir}
        onClick={onSort}
        label={`«${activity.title}»`}
        className="max-w-[9rem]"
      >
        <span className="block truncate">{activity.title}</span>
      </SortHeaderButton>
      <span className="block text-[0.65rem] font-normal text-muted-foreground/70">
        /{activity.maxScore}
        {activity.weight ? ` · ${activity.weight}%` : ""}
      </span>
      {/* Examen de recuperación: no pondera, su nota reemplaza la del módulo. */}
      {activity.recoveryStage && (
        <span
          className={
            activity.recoveryStage === "SEGUNDA_INSTANCIA"
              ? "mt-0.5 inline-block rounded-full bg-purple-100 px-1.5 py-px text-[0.6rem] font-semibold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
              : "mt-0.5 inline-block rounded-full bg-rose-100 px-1.5 py-px text-[0.6rem] font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
          }
        >
          {activity.recoveryStage === "SEGUNDA_INSTANCIA"
            ? "2.ª instancia"
            : "Recuperatorio"}
        </span>
      )}
      {activity.isOffline && !readOnly && (
        <span className="mt-0.5 flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label={`Editar «${activity.title}»`}
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Pencil className="size-3.5" />
          </button>
          <DeleteButton
            action={() => deleteContentAction(moduleId, activity.id)}
            title="¿Eliminar esta actividad?"
            confirmMessage={`Se eliminará «${activity.title}» y sus calificaciones.`}
          />
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Editar calificación</DialogTitle>
                <DialogDescription>
                  Modifica el nombre o el peso de esta calificación.
                </DialogDescription>
              </DialogHeader>
              <EditActivityForm
                moduleId={moduleId}
                activity={activity}
                onDone={() => setEditOpen(false)}
                onCancel={() => setEditOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </span>
      )}
    </th>
  );
}

function StudentRow({
  moduleId,
  row,
  activities,
  readOnly,
}: {
  moduleId: string;
  row: GradebookRow;
  activities: GradebookActivity[];
  readOnly: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  // Las etiquetas aprobado/reprobado solo se muestran cuando el módulo está
  // concluido (readOnly). Mientras está activo se mantiene "En curso".
  const effectiveStatus = row.moduleGrade
    ? readOnly
      ? row.moduleGrade.status
      : "IN_PROGRESS"
    : null;
  const grade = effectiveStatus ? GRADE_STATUS[effectiveStatus] : null;
  const fullName = `${row.student.lastName} ${row.student.firstName}`;

  return (
    <>
      <tr className="border-b last:border-0 hover:bg-muted/30">
        <th
          scope="row"
          className="sticky left-0 z-10 bg-card px-4 py-2.5 text-left font-normal"
        >
          <span className="block truncate text-sm font-medium">{fullName}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {row.student.email}
          </span>
        </th>
        {activities.map((a, i) => {
          const cell = row.grades[i];
          return a.isOffline && !readOnly ? (
            <td key={a.id} className="px-2 py-2 text-center">
              <ScoreCell
                moduleId={moduleId}
                activityId={a.id}
                studentId={row.student.id}
                maxScore={a.maxScore}
                score={cell?.score ?? null}
              />
            </td>
          ) : (
            <td key={a.id} className="px-3 py-2.5 text-center tabular-nums">
              {cell?.score !== null && cell?.score !== undefined ? (
                <span className="font-medium">{cell.score}</span>
              ) : (
                <span className="text-muted-foreground/50">—</span>
              )}
            </td>
          );
        })}
        <td className="px-3 py-2.5 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="font-heading text-sm font-bold tabular-nums">
              {row.moduleGrade?.finalScore ?? "—"}
            </span>
            {grade && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
                  grade.cls,
                )}
              >
                {grade.label}
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5 text-right">
          <div className="flex items-center justify-end gap-1">
            <WhatsAppButton phone={row.student.phone} name={fullName} />
            {readOnly ? (
              <span className="block max-w-[12rem] truncate text-xs text-muted-foreground">
                {row.observation || "—"}
              </span>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                {row.observation ? (
                  <Pencil className="size-3.5" />
                ) : (
                  <MessageSquarePlus className="size-3.5" />
                )}
                <span className="hidden sm:inline">
                  {row.observation ? "Editar" : "Agregar"}
                </span>
              </Button>
            )}
          </div>
          {!readOnly && (
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {row.observation
                        ? "Editar observación"
                        : "Agregar observación"}
                    </DialogTitle>
                    <DialogDescription>
                      Comentario sobre el desempeño de{" "}
                      <span className="font-medium text-foreground">
                        {fullName}
                      </span>{" "}
                      en el módulo. El estudiante lo verá en sus notas.
                    </DialogDescription>
                  </DialogHeader>
                  <ObservationEditor
                    moduleId={moduleId}
                    studentId={row.student.id}
                    initial={row.observation}
                    onDone={() => {
                      setEditOpen(false);
                      router.refresh();
                    }}
                    onCancel={() => setEditOpen(false)}
                  />
                </DialogContent>
              </Dialog>
          )}
        </td>
      </tr>
    </>
  );
}

/** Celda editable de puntaje para una actividad presencial. Guarda al salir. */
function ScoreCell({
  moduleId,
  activityId,
  studentId,
  maxScore,
  score,
}: {
  moduleId: string;
  activityId: string;
  studentId: string;
  maxScore: number;
  score: number | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(score !== null ? String(score) : "");
  const [pending, startTransition] = useTransition();

  function commit() {
    const trimmed = value.trim();
    if (trimmed === "") return; // vacío: no se guarda (no borra una nota previa)
    const n = Number(trimmed);
    if (Number.isNaN(n) || n < 0 || n > maxScore) {
      toast.error(`La nota debe estar entre 0 y ${maxScore}`);
      setValue(score !== null ? String(score) : "");
      return;
    }
    if (n === score) return; // sin cambios
    startTransition(async () => {
      const result = await gradeStudentAction(
        moduleId,
        activityId,
        studentId,
        n,
      );
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error);
        setValue(score !== null ? String(score) : "");
      }
    });
  }

  return (
    <span className="relative inline-flex items-center">
      <input
        type="number"
        min={0}
        max={maxScore}
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        aria-label={`Nota sobre ${maxScore}`}
        placeholder="—"
        className="h-8 w-14 rounded-lg border bg-background text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      />
      {pending && (
        <Loader2 className="absolute -right-4 size-3 animate-spin text-muted-foreground" />
      )}
    </span>
  );
}

function NewActivityForm({
  moduleId,
  onDone,
  onCancel,
}: {
  moduleId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const uid = useId();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [weight, setWeight] = useState("100");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Ponle un nombre a la actividad");
      return;
    }
    startTransition(async () => {
      const result = await createContentAction(moduleId, {
        kind: "ACTIVITY",
        title: title.trim(),
        isOffline: true,
        isPublished: true,
        activityType: "ASSIGNMENT",
        // Campo vacío/inválido → default 100 (el backend rechaza maxScore 0).
        maxScore: Number(maxScore) > 0 ? Number(maxScore) : 100,
        weight: Number(weight) || 0,
      });
      if (result.ok) {
        toast.success("Calificación creada");
        onDone();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} aria-label="Nueva calificación">
      <div className="grid gap-3">
        <div>
          <Label htmlFor={`${uid}-title`}>Nombre</Label>
          <Input
            id={`${uid}-title`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Exposición oral, Examen escrito…"
            className="mt-1.5"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`${uid}-max`}>Puntaje máx.</Label>
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
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Cuenta para la nota del módulo según su peso. Luego carga el puntaje de
        cada estudiante en su columna.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Crear
        </Button>
      </div>
    </form>
  );
}

/** Edita el título (y opcionalmente puntaje máx./peso) de una calificación
 * offline desde el encabezado de su columna. Se monta/desmonta con el Dialog,
 * por lo que los campos se reinicializan al abrir sin `useEffect`. */
function EditActivityForm({
  moduleId,
  activity,
  onDone,
  onCancel,
}: {
  moduleId: string;
  activity: GradebookActivity;
  onDone: () => void;
  onCancel: () => void;
}) {
  const uid = useId();
  const router = useRouter();
  const [title, setTitle] = useState(activity.title);
  const [weight, setWeight] = useState(String(activity.weight ?? 0));
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Ponle un nombre a la calificación");
      return;
    }
    startTransition(async () => {
      const result = await updateContentAction(moduleId, activity.id, {
        title: title.trim(),
        weight: Number(weight) || 0,
      });
      if (result.ok) {
        toast.success("Calificación actualizada");
        onDone();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} aria-label="Editar calificación">
      <div className="grid gap-3">
        <div>
          <Label htmlFor={`${uid}-title`}>Nombre</Label>
          <Input
            id={`${uid}-title`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Exposición oral, Examen escrito…"
            className="mt-1.5"
            autoFocus
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
            className="mt-1.5 w-28"
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Cambiar el peso recalcula la nota del módulo. El puntaje máximo no se
        puede modificar después de crear la calificación.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Guardar
        </Button>
      </div>
    </form>
  );
}

/** Editor de la observación del estudiante. Se monta/desmonta con su Dialog, por
 * lo que el textarea se reinicializa al abrir sin `useEffect`. */
function ObservationEditor({
  moduleId,
  studentId,
  initial,
  onDone,
  onCancel,
}: {
  moduleId: string;
  studentId: string;
  initial: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await setObservationAction(moduleId, studentId, value);
      if (result.ok) {
        toast.success("Observación guardada");
        onDone();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Comentario sobre el desempeño del estudiante en el módulo…"
        className="min-h-28"
        aria-label="Observación del estudiante"
        autoFocus
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Guardar
        </Button>
      </div>
    </div>
  );
}
