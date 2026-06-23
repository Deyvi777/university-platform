import { requireUser } from "@/lib/auth-guard";
import {
  getKardex,
  type CourseStatus,
  type KardexCourse,
  type ModuleGradeStatus,
} from "@/lib/api/me";
import { PrintBar } from "./print-bar";

export const metadata = {
  title: "Kárdex — PDF",
};

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

function today(): string {
  return new Date().toLocaleDateString("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function KardexPdfPage() {
  const session = await requireUser();
  const courses = await getKardex();
  const fullName = session.user.name?.trim() || session.user.email || "";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 print:bg-white print:p-0">
      <style>{`@media print { @page { margin: 1.4cm; } }`}</style>
      <PrintBar />

      {/* Documento (hoja) */}
      <article
        className="mx-auto max-w-3xl rounded-xl bg-white p-10 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none"
        style={{
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* Encabezado */}
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2">
            <span className="font-heading text-2xl font-bold tracking-tight text-blue-900">
              Certificate
            </span>
          </div>
          <div className="text-right">
            <h1 className="font-heading text-xl font-bold tracking-tight">
              Kárdex académico
            </h1>
            <p className="text-xs text-slate-500">Generado el {today()}</p>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Estudiante
            </p>
            <p className="font-medium">{fullName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Correo
            </p>
            <p className="font-medium">{session.user.email}</p>
          </div>
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
    </main>
  );
}

function CourseBlock({ course }: { course: KardexCourse }) {
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
          <p className="mt-0.5">
            Promedio:{" "}
            <span className="font-bold text-slate-900">
              {course.average !== null ? course.average : "—"}
            </span>
          </p>
          <p>
            Aprobados: {course.passedCount}/{course.moduleCount}
          </p>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="w-10 px-5 py-2 font-medium">N°</th>
            <th className="px-2 py-2 font-medium">Módulo</th>
            <th className="px-2 py-2 text-center font-medium">Créditos</th>
            <th className="px-2 py-2 text-center font-medium">Nota</th>
            <th className="px-5 py-2 text-right font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {course.modules.map((m) => {
            const grade = m.grade ? GRADE_STATUS[m.grade.status] : null;
            return (
              <tr
                key={m.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-5 py-2 text-slate-400">{m.order}</td>
                <td className="px-2 py-2 font-medium">{m.name}</td>
                <td className="px-2 py-2 text-center text-slate-500">
                  {m.credits ?? "—"}
                </td>
                <td className="px-2 py-2 text-center font-bold tabular-nums">
                  {m.grade?.finalScore !== null &&
                  m.grade?.finalScore !== undefined
                    ? m.grade.finalScore
                    : "—"}
                </td>
                <td className="px-5 py-2 text-right">
                  {grade ? (
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${grade.color}`}
                    >
                      {grade.label}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Sin nota</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
