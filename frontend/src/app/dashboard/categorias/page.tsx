import { requireAdmin } from "@/lib/auth-guard";
import { listAdminCategories } from "@/lib/api/admin";
import { CategoriesList } from "@/app/dashboard/categorias/categories-list";
import { CreateCategoryButton } from "@/app/dashboard/categorias/category-dialogs";

export default async function CategoriasAdminPage() {
  await requireAdmin();
  const categories = await listAdminCategories();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="mt-1 text-muted-foreground">
            Tipos de programa para clasificar la oferta académica. Arrastra para
            reordenar; ese orden es el que se muestra en la landing.
          </p>
        </div>
        <CreateCategoryButton />
      </div>

      <CategoriesList categories={categories} />
    </div>
  );
}
