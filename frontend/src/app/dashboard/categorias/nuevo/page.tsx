import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { CategoryForm } from "@/app/dashboard/categorias/category-form";

export default async function NuevaCategoriaPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/categorias"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a categorías
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Nueva categoría</h1>
      <div className="mt-6">
        <CategoryForm />
      </div>
    </div>
  );
}
