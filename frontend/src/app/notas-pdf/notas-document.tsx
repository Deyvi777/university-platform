import Image from "next/image";
import type {
  CourseStatus,
  ModuleGradeStatus,
  StudentGradeCourse,
  StudentGradeModule,
} from "@/lib/api/admin";

/**
 * Documento imprimible del detalle de notas por actividad (hoja blanca con
 * membrete), con estilo claro EXPLÍCITO para que el PDF sea consistente. Lo usa
 * la vista `/notas-pdf/[studentId]` del ADMIN.
 */

const COURSE_STATUS: Record<CourseStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "En curso",
  FINISHED: "Concluido",
  ARCHIVED: "Archivado",
};

const GRADE_STATUS: Record<ModuleGradeStatus, { label: string; color: string }> =
  {
    IN_PROGRESS: { label: "En curso", color: "bg-amber-100 text-amber-800" },
    PASSED: { label: "Aprobado", color: "bg-emerald-100 text-emerald-800" },
    FAILED: { label: "Reprobado", color: "bg-rose-100 text-rose-800" },
  };

/** Nota final efectiva del módulo: aprobado/reprobado solo si está concluido. */
export function effectiveModuleStatus(
  m: StudentGradeModule,
): ModuleGradeStatus | null {
  if (!m.grade) return null;
  return m.status === "FINISHED" ? m.grade.status : "IN_PROGRESS";
}

function today(): string {
  return new Date().toLocaleDateString("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function NotasDocument({
  courses,
  studentName,
  studentEmail,
  studentDocument,
}: {
  courses: StudentGradeCourse[];
  studentName: string;
  studentEmail: string;
  studentDocument?: string | null;
}) {
  return (
    <article
      className="mx-auto max-w-3xl rounded-xl bg-white p-10 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none"
      style={{
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <Image
          src="/landing/membrete.webp"
          alt="Certificate — Escuela Multidisciplinaria de Postgrado"
          width={207}
          height={100}
          priority
          className="h-auto w-32"
        />
        <div className="text-right">
          <h1 className="font-heading text-xl font-bold tracking-tight">
            Detalle de notas
          </h1>
          <p className="text-xs text-slate-500">Generado el {today()}</p>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.5fr)_auto] gap-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Estudiante
          </p>
          <p className="font-medium">{studentName}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Correo
          </p>
          <p className="font-medium">{studentEmail}</p>
        </div>
        {studentDocument && (
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Documento
            </p>
            <p className="font-medium">{studentDocument}</p>
          </div>
        )}
      </section>

      {courses.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          No hay notas registradas todavía.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {courses.map((course) => (
            <CourseBlock key={course.id} course={course} />
          ))}
        </div>
      )}

      <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-[0.7rem] text-slate-400">
        Documento informativo generado por la plataforma Certificate. No
        constituye un certificado oficial.
      </footer>
    </article>
  );
}

function CourseBlock({ course }: { course: StudentGradeCourse }) {
  return (
    <section className="break-inside-avoid rounded-lg border border-slate-200">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div>
          <p className="font-mono text-[0.7rem] tracking-wide text-slate-400">
            {course.code}
          </p>
          <h2 className="font-heading text-base font-bold">{course.name}</h2>
        </div>
        <div className="shrink-0 text-right text-xs text-slate-500">
          <p>{COURSE_STATUS[course.status]}</p>
          <p className="mt-0.5">Nota mínima: {course.passingScore}</p>
        </div>
      </div>

      {course.modules.length === 0 ? (
        <p className="px-5 py-4 text-xs text-slate-400">
          Sin módulos visibles.
        </p>
      ) : (
        <div className="divide-y divide-slate-200">
          {course.modules.map((m) => (
            <ModuleBlock key={m.id} module={m} />
          ))}
        </div>
      )}
    </section>
  );
}

function ModuleBlock({ module: m }: { module: StudentGradeModule }) {
  const status = effectiveModuleStatus(m);
  const grade = status ? GRADE_STATUS[status] : null;

  return (
    <div className="break-inside-avoid px-5 py-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold">
          <span className="text-slate-400">Módulo {m.order} · </span>
          {m.name}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-heading text-base font-bold tabular-nums">
            {m.grade?.finalScore !== null && m.grade?.finalScore !== undefined
              ? m.grade.finalScore
              : "—"}
          </span>
          {grade ? (
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${grade.color}`}
            >
              {grade.label}
            </span>
          ) : (
            <span className="text-[0.65rem] text-slate-400">Sin nota</span>
          )}
        </div>
      </div>

      {m.activities.length > 0 && (
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[0.65rem] text-slate-400">
              <th className="py-1.5 font-medium">Actividad</th>
              <th className="py-1.5 text-center font-medium">Peso</th>
              <th className="py-1.5 text-right font-medium">Nota</th>
            </tr>
          </thead>
          <tbody>
            {m.activities.map((a) => (
              <tr
                key={a.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="py-1.5">{a.title}</td>
                <td className="py-1.5 text-center text-slate-500">
                  {a.weight !== null ? `${a.weight}%` : "—"}
                </td>
                <td className="py-1.5 text-right font-medium tabular-nums">
                  {a.score !== null ? (
                    <>
                      {a.score}
                      <span className="text-slate-400">
                        /{a.maxScore ?? 100}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {m.grade?.observations && (
        <p className="mt-2 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-[0.7rem] text-slate-600">
          <span className="font-semibold">Observación: </span>
          {m.grade.observations}
        </p>
      )}
    </div>
  );
}
