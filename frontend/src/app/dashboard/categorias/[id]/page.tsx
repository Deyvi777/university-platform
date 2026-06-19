import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { AdminApiError, getAdminCategory } from "@/lib/api/admin";
import { CategoryForm } from "@/app/dashboard/categorias/category-form";

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  let category;
  try {
    category = await getAdminCategory(id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/categorias"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a categorías
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Editar categoría
      </h1>
      <div className="mt-6">
        <CategoryForm category={category} />
      </div>
    </div>
  );
}
