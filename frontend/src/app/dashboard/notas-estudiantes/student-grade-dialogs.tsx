"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  Download,
  Loader2,
  ScrollText,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type {
  AdminUser,
  ModuleGradeStatus,
  StudentGradeCourse,
  StudentGradeModule,
} from "@/lib/api/admin";
import type { KardexCourse } from "@/lib/api/me";
import { KardexCourseCard } from "@/app/dashboard/kardex/kardex-cards";

const GRADE_BADGE: Record<ModuleGradeStatus, { label: string; badge: string }> =
  {
    IN_PROGRESS: {
      label: "En curso",
      badge:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    },
    PASSED: {
      label: "Aprobado",
      badge:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    FAILED: {
      label: "Reprobado",
      badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    },
  };

/** Nota final efectiva: aprobado/reprobado solo si el módulo está concluido. */
function effectiveStatus(m: StudentGradeModule): ModuleGradeStatus | null {
  if (!m.grade) return null;
  return m.status === "FINISHED" ? m.grade.status : "IN_PROGRESS";
}

function studentName(s: AdminUser): string {
  return `${s.lastName} ${s.firstName}`.trim();
}

/** Panel con los datos del estudiante en la parte superior del modal. */
function StudentInfoPanel({ student }: { student: AdminUser }) {
  return (
    <div className="rounded-xl border bg-muted/40 px-4 py-3">
      <p className="font-heading text-base font-semibold">
        {studentName(student)}
      </p>
      <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <InfoItem label="Correo" value={student.email} />
        <InfoItem label="Teléfono" value={student.phone} />
        <InfoItem label="Documento" value={student.idDocument ?? "—"} />
      </dl>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}

/** Enlace de descarga estilizado como botón secundario (abre la vista PDF). */
function PdfDownloadLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-900/20 transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
    >
      <Download className="size-4" aria-hidden="true" />
      Descargar PDF
    </a>
  );
}

function DialogStateMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

// ── Modal: detalle de notas por actividad ────────────────────────────────────

export function StudentNotesButton({ student }: { student: AdminUser }) {
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError } = useQuery<StudentGradeCourse[]>({
    queryKey: ["admin-student-grades", student.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/students/${student.id}/grades`);
      if (!res.ok) throw new Error("No se pudieron cargar las notas");
      return res.json();
    },
    enabled: open,
  });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300 dark:hover:bg-sky-500/25 dark:hover:text-sky-200"
      >
        <ClipboardList className="size-3.5" /> Notas
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de notas</DialogTitle>
            <DialogDescription>
              Detalle por actividad de cada módulo en sus programas inscritos.
            </DialogDescription>
          </DialogHeader>

          <StudentInfoPanel student={student} />

          {isLoading && (
            <DialogStateMessage>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              Cargando notas…
            </DialogStateMessage>
          )}
          {isError && (
            <DialogStateMessage>
              No se pudieron cargar las notas. Intenta de nuevo.
            </DialogStateMessage>
          )}
          {data &&
            (data.length === 0 ? (
              <DialogStateMessage>
                Este estudiante todavía no tiene notas registradas.
              </DialogStateMessage>
            ) : (
              <>
                <div className="space-y-5">
                  {data.map((course) => (
                    <GradesCourse key={course.id} course={course} />
                  ))}
                </div>
                <div className="mt-2 flex justify-end">
                  <PdfDownloadLink href={`/notas-pdf/${student.id}`} />
                </div>
              </>
            ))}
        </DialogContent>
      </Dialog>
    </>
  );
}

function GradesCourse({ course }: { course: StudentGradeCourse }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b bg-muted/40 px-4 py-3">
        <p className="font-mono text-xs text-muted-foreground">{course.code}</p>
        <h3 className="font-heading text-base font-bold">{course.name}</h3>
      </div>
      {course.modules.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">
          Sin módulos visibles.
        </p>
      ) : (
        <div className="divide-y">
          {course.modules.map((m) => (
            <GradesModule key={m.id} module={m} />
          ))}
        </div>
      )}
    </section>
  );
}

function GradesModule({ module: m }: { module: StudentGradeModule }) {
  const status = effectiveStatus(m);
  const badge = status ? GRADE_BADGE[status] : null;

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">
          <span className="text-muted-foreground">Módulo {m.order} · </span>
          {m.name}
        </h4>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-heading text-base font-bold tabular-nums">
            {m.grade?.finalScore !== null && m.grade?.finalScore !== undefined
              ? m.grade.finalScore
              : "—"}
          </span>
          {badge ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                badge.badge,
              )}
            >
              {badge.label}
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Sin nota
            </span>
          )}
        </div>
      </div>

      {m.activities.length > 0 && (
        <ul className="mt-2 space-y-1">
          {m.activities.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-1.5 text-sm"
            >
              <span className="min-w-0 truncate">
                {a.title}
                {a.weight !== null && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    · {a.weight}%
                  </span>
                )}
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {a.score !== null ? (
                  <>
                    {a.score}
                    <span className="text-muted-foreground">
                      /{a.maxScore ?? 100}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {m.grade?.observations && (
        <p className="mt-2 rounded-lg border bg-background px-3 py-1.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Observación: </span>
          {m.grade.observations}
        </p>
      )}
    </div>
  );
}

// ── Modal: kárdex (igual que el panel del estudiante) ────────────────────────

export function StudentKardexButton({ student }: { student: AdminUser }) {
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError } = useQuery<KardexCourse[]>({
    queryKey: ["admin-student-kardex", student.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/students/${student.id}/kardex`);
      if (!res.ok) throw new Error("No se pudo cargar el kárdex");
      return res.json();
    },
    enabled: open,
  });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/25 dark:hover:text-violet-200"
      >
        <ScrollText className="size-3.5" /> Kárdex
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kárdex</DialogTitle>
            <DialogDescription>
              Historial académico: la nota de cada módulo por curso.
            </DialogDescription>
          </DialogHeader>

          <StudentInfoPanel student={student} />

          {isLoading && (
            <DialogStateMessage>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              Cargando kárdex…
            </DialogStateMessage>
          )}
          {isError && (
            <DialogStateMessage>
              No se pudo cargar el kárdex. Intenta de nuevo.
            </DialogStateMessage>
          )}
          {data &&
            (data.length === 0 ? (
              <DialogStateMessage>
                Este estudiante todavía no tiene un kárdex con notas.
              </DialogStateMessage>
            ) : (
              <>
                <div className="space-y-5">
                  {data.map((course) => (
                    <KardexCourseCard key={course.id} course={course} />
                  ))}
                </div>
                <div className="mt-2 flex justify-end">
                  <PdfDownloadLink href={`/kardex-pdf/${student.id}`} />
                </div>
              </>
            ))}
        </DialogContent>
      </Dialog>
    </>
  );
}
