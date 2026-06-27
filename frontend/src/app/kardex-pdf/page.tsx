import type { Metadata } from "next";
import { auth } from "@/auth";
import { requireUser } from "@/lib/auth-guard";
import { getKardex } from "@/lib/api/me";
import { KardexDocument } from "./kardex-document";
import { PrintBar } from "./print-bar";

// El navegador usa el `<title>` como nombre sugerido al "Guardar como PDF".
export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const name =
    session?.user?.name?.trim() || session?.user?.email || "Estudiante";
  return { title: `${name} - Kárdex` };
}

export default async function KardexPdfPage() {
  const session = await requireUser();
  const courses = await getKardex();
  const fullName = session.user.name?.trim() || session.user.email || "";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 print:bg-white print:p-0">
      <style>{`@media print { @page { margin: 1.4cm; } }`}</style>
      <PrintBar />
      <KardexDocument
        courses={courses}
        studentName={fullName}
        studentEmail={session.user.email ?? ""}
      />
    </main>
  );
}
