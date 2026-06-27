import { BackLink } from "@/components/dashboard/back-link";
import { requireAdmin } from "@/lib/auth-guard";
import { CategoryForm } from "@/app/dashboard/categorias/category-form";

export default async function NuevaCategoriaPage() {
  await requireAdmin();

  return (
    <div className="w-full">
      <BackLink href="/dashboard/categorias">Volver a categorías</BackLink>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Nueva categoría</h1>
      <div className="mt-6">
        <CategoryForm />
      </div>
    </div>
  );
}
