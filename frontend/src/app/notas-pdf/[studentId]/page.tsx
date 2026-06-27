import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import {
  AdminApiError,
  getAdminUser,
  getStudentGrades,
} from "@/lib/api/admin";
import { PrintBar } from "@/app/kardex-pdf/print-bar";
import { NotasDocument } from "../notas-document";

// El navegador usa el `<title>` como nombre sugerido al "Guardar como PDF".
export async function generateMetadata({
  params,
}: {
  params: Promise<{ studentId: string }>;
}): Promise<Metadata> {
  try {
    const { studentId } = await params;
    const student = await getAdminUser(studentId);
    return { title: `${student.firstName} ${student.lastName}`.trim() + " - Notas" };
  } catch {
    return { title: "Notas del estudiante" };
  }
}

/** Vista imprimible del detalle de notas de un estudiante (solo ADMIN). */
export default async function NotasPdfPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  await requireAdmin();
  const { studentId } = await params;

  let student;
  try {
    student = await getAdminUser(studentId);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }
  const courses = await getStudentGrades(studentId);
  const fullName = `${student.firstName} ${student.lastName}`.trim();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 print:bg-white print:p-0">
      <style>{`@media print { @page { margin: 1.4cm; } }`}</style>
      <PrintBar backHref="/dashboard/notas-estudiantes" />
      <NotasDocument
        courses={courses}
        studentName={fullName}
        studentEmail={student.email}
        studentDocument={student.idDocument}
      />
    </main>
  );
}
