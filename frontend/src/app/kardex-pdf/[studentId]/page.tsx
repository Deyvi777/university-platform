import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import {
  AdminApiError,
  getAdminUser,
  getStudentKardex,
} from "@/lib/api/admin";
import { KardexDocument } from "../kardex-document";
import { PrintBar } from "../print-bar";

// El navegador usa el `<title>` como nombre sugerido al "Guardar como PDF".
export async function generateMetadata({
  params,
}: {
  params: Promise<{ studentId: string }>;
}): Promise<Metadata> {
  try {
    const { studentId } = await params;
    const student = await getAdminUser(studentId);
    return {
      title: `${student.firstName} ${student.lastName}`.trim() + " - Kárdex",
    };
  } catch {
    return { title: "Kárdex del estudiante" };
  }
}

/**
 * Vista imprimible del kárdex de un estudiante para el ADMIN (mismo documento
 * que el del estudiante, pero con sus datos y autorización de admin).
 */
export default async function AdminKardexPdfPage({
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
  const courses = await getStudentKardex(studentId);
  const fullName = `${student.firstName} ${student.lastName}`.trim();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 print:bg-white print:p-0">
      <style>{`@media print { @page { margin: 1.4cm; } }`}</style>
      <PrintBar backHref="/dashboard/notas-estudiantes" />
      <KardexDocument
        courses={courses}
        studentName={fullName}
        studentEmail={student.email}
        studentDocument={student.idDocument}
      />
    </main>
  );
}
