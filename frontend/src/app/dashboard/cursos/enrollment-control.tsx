"use client";

import { Check, GraduationCap, Loader2, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  addEnrollmentsAction,
  removeEnrollmentAction,
} from "@/app/dashboard/cursos/actions";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const AVATAR_TINTS = [
  "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
] as const;

function tintFor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return AVATAR_TINTS[sum % AVATAR_TINTS.length];
}

function Avatar({ student }: { student: Student }) {
  return (
    <span
      aria-hidden
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full font-heading text-xs font-semibold ${tintFor(
        student.id,
      )}`}
    >
      {initials(student.firstName, student.lastName)}
    </span>
  );
}

export function EnrollmentControl({
  courseId,
  students,
  enrolled,
}: {
  courseId: string;
  students: Student[];
  enrolled: Student[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingAdd, setPendingAdd] = useState(false);

  const enrolledIds = new Set(enrolled.map((s) => s.id));
  const available = students.filter((s) => !enrolledIds.has(s.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function add() {
    if (selected.size === 0) return;
    setPendingAdd(true);
    const result = await addEnrollmentsAction(courseId, Array.from(selected));
    setPendingAdd(false);
    if (result.ok) {
      toast.success("Estudiantes inscritos");
      setSelected(new Set());
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 font-medium text-foreground">
            <GraduationCap className="size-3.5" />
            <span className="tabular-nums">{enrolled.length}</span>
          </span>
          {enrolled.length === 1
            ? "estudiante inscrito"
            : "estudiantes inscritos"}{" "}
          · acceso a todos los módulos.
        </p>
        {/* Acción primaria de la sección: sólido institucional sobrio (token primary) */}
        <Button
          type="button"
          aria-expanded={open}
          className="shadow-xs"
          onClick={() => {
            setSelected(new Set());
            setOpen((v) => !v);
          }}
        >
          <UserPlus className="size-4" /> Inscribir estudiantes
        </Button>
      </div>

      {open && (
        <div className="rounded-xl border bg-muted/30 p-3 shadow-xs">
          {available.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                <GraduationCap className="size-5" />
              </span>
              <p className="text-sm text-muted-foreground">
                {students.length === 0 ? (
                  <>
                    No hay estudiantes registrados.{" "}
                    <Link
                      href="/dashboard/usuarios/nuevo?rol=estudiantes"
                      className="font-medium text-foreground underline underline-offset-2"
                    >
                      Crea un estudiante
                    </Link>{" "}
                    primero.
                  </>
                ) : (
                  "Todos los estudiantes ya están inscritos."
                )}
              </p>
            </div>
          ) : (
            <>
              <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
                Selecciona los estudiantes a inscribir
              </p>
              <ul className="max-h-56 space-y-0.5 overflow-auto">
                {available.map((s) => {
                  const checked = selected.has(s.id);
                  return (
                    <li key={s.id}>
                      <label
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-sm transition-colors ${
                          checked
                            ? "border-sky-300 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-500/10"
                            : "border-transparent hover:bg-background"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="size-4 shrink-0 accent-sky-500"
                          checked={checked}
                          onChange={() => toggle(s.id)}
                        />
                        <Avatar student={s} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {s.firstName} {s.lastName}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {s.email}
                          </span>
                        </span>
                        {checked && (
                          <Check className="ml-auto size-4 shrink-0 text-sky-600 dark:text-sky-400" />
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex items-center gap-2 border-t pt-3">
                <Button
                  type="button"
                  size="sm"
                  disabled={selected.size === 0 || pendingAdd}
                  onClick={add}
                >
                  {pendingAdd ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Inscribir ({selected.size})
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pendingAdd}
                  onClick={() => setOpen(false)}
                >
                  <X className="size-4" />
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {enrolled.length > 0 ? (
        <ul className="divide-y rounded-xl border bg-card">
          {enrolled.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <Avatar student={s} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {s.firstName} {s.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.email}
                </p>
              </div>
              <DeleteButton
                action={() => removeEnrollmentAction(courseId, s.id)}
                title="¿Quitar este estudiante?"
                confirmMessage={`Se retirará la inscripción de "${s.firstName} ${s.lastName}" del programa. Podrás volver a inscribirlo cuando quieras.`}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
            <GraduationCap className="size-5" />
          </span>
          <p className="text-sm text-muted-foreground">
            Aún no hay estudiantes inscritos en este programa.
          </p>
        </div>
      )}
    </div>
  );
}
