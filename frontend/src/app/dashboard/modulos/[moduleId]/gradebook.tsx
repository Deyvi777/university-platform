"use client";

import { useId, useState, useTransition } from "react";
import {
  Loader2,
  MessageSquarePlus,
  Pencil,
  Plus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DeleteButton } from "@/components/admin/delete-button";
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

export function Gradebook({
  moduleId,
  gradebook,
}: {
  moduleId: string;
  gradebook: ModuleGradebook | null;
}) {
  const [addOpen, setAddOpen] = useState(false);

  if (!gradebook) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
        No se pudo cargar la libreta de calificaciones.
      </div>
    );
  }

  const { activities, students } = gradebook;

  return (
    <section className="rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
        <div>
          <h2 className="font-heading text-base font-semibold">
            Libreta de calificaciones
          </h2>
          <p className="text-xs text-muted-foreground">
            Notas por actividad, nota del módulo (calculada) y tu observación.
            Puedes agregar actividades y calificarlas a mano aquí.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> Nueva calificación
        </Button>
      </div>

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
                  Estudiante
                </th>
                {activities.map((a) => (
                  <ActivityHeader key={a.id} moduleId={moduleId} activity={a} />
                ))}
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">
                  Módulo
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
}: {
  moduleId: string;
  activity: GradebookActivity;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <th
      className="px-3 py-2.5 text-center font-medium text-muted-foreground"
      title={activity.title}
    >
      <span className="block max-w-[8rem] truncate">{activity.title}</span>
      <span className="text-[0.65rem] font-normal text-muted-foreground/70">
        /{activity.maxScore}
        {activity.weight ? ` · ${activity.weight}%` : ""}
      </span>
      {activity.isOffline && (
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
}: {
  moduleId: string;
  row: GradebookRow;
  activities: GradebookActivity[];
}) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const grade = row.moduleGrade ? GRADE_STATUS[row.moduleGrade.status] : null;
  const fullName = `${row.student.firstName} ${row.student.lastName}`;

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
          return a.isOffline ? (
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
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
        </td>
      </tr>
      {editing && (
        <tr className="border-b bg-muted/20">
          <td colSpan={activities.length + 3} className="px-4 py-3">
            <ObservationEditor
              moduleId={moduleId}
              studentId={row.student.id}
              studentName={fullName}
              initial={row.observation}
              onDone={() => {
                setEditing(false);
                router.refresh();
              }}
              onCancel={() => setEditing(false)}
            />
          </td>
        </tr>
      )}
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
  const [weight, setWeight] = useState("0");
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
        maxScore: Number(maxScore) || 0,
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

function ObservationEditor({
  moduleId,
  studentId,
  studentName,
  initial,
  onDone,
  onCancel,
}: {
  moduleId: string;
  studentId: string;
  studentName: string;
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
      <label className="text-xs font-medium text-muted-foreground">
        Observación para{" "}
        <span className="font-semibold text-foreground">{studentName}</span>
      </label>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Comentario sobre el desempeño del estudiante en el módulo…"
        className="mt-1.5 min-h-20"
        autoFocus
      />
      <div className="mt-2 flex justify-end gap-2">
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
