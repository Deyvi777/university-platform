"use client";

import { Check, Loader2, Users, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setModuleTeachersAction } from "@/app/dashboard/cursos/actions";

type Teacher = { id: string; firstName: string; lastName: string };

function sameSet(a: Set<string>, ids: string[]): boolean {
  return a.size === ids.length && ids.every((id) => a.has(id));
}

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Paleta de tintes para los avatares de iniciales, asignada de forma estable
// por id para que un mismo docente conserve siempre el mismo color.
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

function Avatar({
  teacher,
  className = "size-7 text-[0.7rem]",
}: {
  teacher: Teacher;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-heading font-semibold ${tintFor(
        teacher.id,
      )} ${className}`}
    >
      {initials(teacher.firstName, teacher.lastName)}
    </span>
  );
}

export function ModuleTeachersControl({
  courseId,
  moduleId,
  professors,
  assignedIds,
}: {
  courseId: string;
  moduleId: string;
  professors: Teacher[];
  assignedIds: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedIds));
  const [pending, setPending] = useState(false);

  const assigned = professors.filter((p) => assignedIds.includes(p.id));
  const dirty = !sameSet(selected, assignedIds);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setPending(true);
    const result = await setModuleTeachersAction(
      courseId,
      moduleId,
      Array.from(selected),
    );
    setPending(false);
    if (result.ok) {
      toast.success("Docentes actualizados");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Docentes asignados como chips con avatar de iniciales */}
        {assigned.length > 0 ? (
          <ul className="flex flex-wrap items-center gap-1.5">
            {assigned.map((t) => (
              <li
                key={t.id}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card py-0.5 pr-3 pl-0.5 text-sm font-medium shadow-xs"
              >
                <Avatar teacher={t} />
                <span className="truncate">
                  {t.firstName} {t.lastName}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4 opacity-70" />
            Sin docentes asignados.
          </span>
        )}

        {/* Acción primaria del módulo: sólido institucional sobrio (token primary) */}
        <Button
          type="button"
          size="sm"
          aria-expanded={open}
          className="shadow-xs"
          onClick={() => {
            setSelected(new Set(assignedIds));
            setOpen((v) => !v);
          }}
        >
          <UserPlus className="size-4" />
          {assigned.length > 0 ? "Editar docentes" : "Asignar docentes"}
        </Button>
      </div>

      {open && (
        <div className="rounded-xl border bg-muted/30 p-3 shadow-xs">
          {professors.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                <Users className="size-5" />
              </span>
              <p className="text-sm text-muted-foreground">
                No hay docentes registrados.{" "}
                <Link
                  href="/dashboard/usuarios/nuevo?rol=docentes"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Crea un docente
                </Link>{" "}
                primero.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
                Selecciona los docentes a cargo de este módulo
              </p>
              <ul className="max-h-56 space-y-0.5 overflow-auto">
                {professors.map((p) => {
                  const checked = selected.has(p.id);
                  return (
                    <li key={p.id}>
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
                          onChange={() => toggle(p.id)}
                        />
                        <Avatar teacher={p} className="size-7 text-[0.7rem]" />
                        <span className="truncate font-medium">
                          {p.firstName} {p.lastName}
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
                  disabled={!dirty || pending}
                  onClick={save}
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => setOpen(false)}
                >
                  <X className="size-4" />
                  Cancelar
                </Button>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                  {selected.size}{" "}
                  {selected.size === 1 ? "seleccionado" : "seleccionados"}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
