import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getModuleGradebook, getTeacherModule } from "@/lib/api/teacher";
import { PrintBar } from "@/app/kardex-pdf/print-bar";
import { LibretaDocument } from "../libreta-document";

// El navegador usa el `<title>` como nombre sugerido al "Guardar como PDF".
export async function generateMetadata({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}): Promise<Metadata> {
  const { moduleId } = await params;
  const mod = await getTeacherModule(moduleId);
  if (!mod) return { title: "Calificaciones del módulo" };
  return {
    title: `${mod.course.name} - Módulo ${mod.order} - Calificaciones`,
  };
}

/**
 * Vista imprimible de la libreta de calificaciones de un módulo. La autoriza el
 * backend por docencia (o ADMIN): si el usuario no dicta el módulo, la libreta
 * llega `null` → 404 (misma regla que `/dashboard/modulos/[moduleId]`).
 */
export default async function LibretaPdfPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  await requireUser();
  const { moduleId } = await params;
  const [mod, gradebook] = await Promise.all([
    getTeacherModule(moduleId),
    getModuleGradebook(moduleId),
  ]);
  if (!mod || !gradebook) {
    notFound();
  }

  // Con muchas columnas de actividad la hoja vertical queda apretada.
  const landscape = gradebook.activities.length >= 5;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 print:bg-white print:p-0">
      <style>{`@media print { @page { ${landscape ? "size: A4 landscape; " : ""}margin: 1.4cm; } }`}</style>
      <PrintBar
        backHref={`/dashboard/modulos/${moduleId}`}
        className="max-w-5xl"
      />
      <LibretaDocument
        gradebook={gradebook}
        courseCode={mod.course.code}
        moduleFinished={mod.status === "FINISHED"}
      />
    </main>
  );
}
