import { BackLink } from "@/components/dashboard/back-link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { AdminApiError, getAdminProgram } from "@/lib/api/admin";
import { getCategories } from "@/lib/api/programs";
import { ProgramForm } from "@/app/dashboard/programas/program-form";

export default async function EditarProgramaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  let program;
  try {
    program = await getAdminProgram(id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }
  const categories = await getCategories();

  return (
    <div className="w-full">
      <BackLink href="/dashboard/programas">Volver a programas</BackLink>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Editar programa
      </h1>
      <div className="mt-6">
        <ProgramForm program={program} categories={categories} />
      </div>
    </div>
  );
}
