import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { getCategories } from "@/lib/api/programs";
import { ProgramForm } from "@/app/dashboard/programas/program-form";

export default async function NuevoProgramaPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <div className="w-full">
      <Link
        href="/dashboard/programas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a programas
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Nuevo programa</h1>
      <div className="mt-6">
        <ProgramForm categories={categories} />
      </div>
    </div>
  );
}
