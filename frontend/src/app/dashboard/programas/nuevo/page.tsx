import { BackLink } from "@/components/dashboard/back-link";
import { requireAdmin } from "@/lib/auth-guard";
import { getCategories } from "@/lib/api/programs";
import { ProgramForm } from "@/app/dashboard/programas/program-form";

export default async function NuevoProgramaPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <div className="w-full">
      <BackLink href="/dashboard/programas">Volver a programas</BackLink>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Nuevo programa</h1>
      <div className="mt-6">
        <ProgramForm categories={categories} />
      </div>
    </div>
  );
}
