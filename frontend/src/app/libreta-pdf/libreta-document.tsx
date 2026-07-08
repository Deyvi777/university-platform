import Image from "next/image";
import type { ModuleGradebook } from "@/lib/api/teacher";
import type { ModuleGradeStatus } from "@/lib/api/me";

/**
 * Documento imprimible de la libreta de calificaciones de un módulo (hoja
 * blanca con membrete): estudiantes × actividades + nota del módulo + estado +
 * observación. Presentacional y con estilo claro EXPLÍCITO (no tokens de tema)
 * para que el PDF sea consistente sin importar el tema del panel. Lo usan el
 * docente y el ADMIN desde `/libreta-pdf/[moduleId]`.
 */

const GRADE_STATUS: Record<ModuleGradeStatus, { label: string; color: string }> =
  {
    IN_PROGRESS: { label: "En curso", color: "bg-amber-100 text-amber-800" },
    PASSED: { label: "Aprobado", color: "bg-emerald-100 text-emerald-800" },
    FAILED: { label: "Reprobado", color: "bg-rose-100 text-rose-800" },
  };

function today(): string {
  return new Date().toLocaleDateString("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function LibretaDocument({
  gradebook,
  courseCode,
  moduleFinished,
}: {
  gradebook: ModuleGradebook;
  courseCode: string;
  /** Aprobado/Reprobado solo se muestran cuando el módulo está concluido. */
  moduleFinished: boolean;
}) {
  const { module: mod, course, activities, students } = gradebook;

  return (
    <article
      className="mx-auto max-w-5xl rounded-xl bg-white p-10 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none"
      style={{
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Encabezado */}
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
            Libreta de calificaciones
          </h1>
          <p className="text-xs text-slate-500">Generada el {today()}</p>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_auto] gap-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Programa
          </p>
          <p className="font-medium">
            {course.name}
            {courseCode && (
              <span className="ml-1.5 font-mono text-[0.7rem] tracking-wide text-slate-400">
                {courseCode}
              </span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Módulo {mod.order}
          </p>
          <p className="font-medium">{mod.name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Nota de aprobación
          </p>
          <p className="font-medium">{course.passingScore}</p>
        </div>
      </section>

      {students.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          No hay estudiantes inscritos en este programa.
        </p>
      ) : (
        <table className="mt-6 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-50 text-left text-slate-500">
              <th className="w-8 px-2 py-2 font-medium">N°</th>
              <th className="px-2 py-2 font-medium">Estudiante</th>
              {activities.map((a) => (
                <th key={a.id} className="px-2 py-2 text-center font-medium">
                  <span className="block break-words">{a.title}</span>
                  <span className="block text-[0.65rem] font-normal text-slate-400">
                    /{a.maxScore}
                    {a.recoveryStage
                      ? a.recoveryStage === "SEGUNDA_INSTANCIA"
                        ? " · 2.ª instancia"
                        : " · Recuperatorio"
                      : a.weight
                        ? ` · ${a.weight}%`
                        : ""}
                  </span>
                </th>
              ))}
              <th className="px-2 py-2 text-center font-medium">Módulo</th>
              <th className="px-2 py-2 text-center font-medium">Estado</th>
              <th className="px-2 py-2 text-right font-medium">Observación</th>
            </tr>
          </thead>
          <tbody>
            {students.map((row, i) => {
              // Aprobado/reprobado solo si el módulo está concluido.
              const effectiveStatus = row.moduleGrade
                ? moduleFinished
                  ? row.moduleGrade.status
                  : "IN_PROGRESS"
                : null;
              const grade = effectiveStatus
                ? GRADE_STATUS[effectiveStatus]
                : null;
              return (
                <tr
                  key={row.student.id}
                  className="break-inside-avoid border-b border-slate-100 last:border-0"
                >
                  <td className="px-2 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-2 py-2">
                    <span className="block font-medium">
                      {row.student.lastName} {row.student.firstName}
                    </span>
                    <span className="block text-[0.65rem] text-slate-400">
                      {row.student.email}
                    </span>
                  </td>
                  {activities.map((a) => {
                    const score =
                      row.grades.find((g) => g.activityId === a.id)?.score ??
                      null;
                    return (
                      <td
                        key={a.id}
                        className="px-2 py-2 text-center tabular-nums"
                      >
                        {score !== null ? (
                          <span className="font-medium">{score}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-center font-bold tabular-nums">
                    {row.moduleGrade?.finalScore ?? "—"}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {grade ? (
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${grade.color}`}
                      >
                        {grade.label}
                      </span>
                    ) : (
                      <span className="text-[0.65rem] text-slate-400">
                        Sin nota
                      </span>
                    )}
                  </td>
                  <td className="max-w-[12rem] px-2 py-2 text-right text-[0.65rem] text-slate-500">
                    {row.observation || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-[0.7rem] text-slate-400">
        Documento informativo generado por la plataforma Certificate. No
        constituye un certificado oficial.
      </footer>
    </article>
  );
}
