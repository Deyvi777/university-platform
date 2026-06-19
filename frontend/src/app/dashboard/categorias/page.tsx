import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { listAdminCategories } from "@/lib/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCategoryAction } from "@/app/dashboard/categorias/actions";

export default async function CategoriasAdminPage() {
  await requireAdmin();
  const categories = await listAdminCategories();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="mt-1 text-muted-foreground">
            Tipos de programa disponibles para clasificar la oferta académica.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/categorias/nuevo" />}
        >
          <Plus className="size-4" /> Nueva categoría
        </Button>
      </div>

      <div className="mt-6 rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Programas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Aún no hay categorías.
                </TableCell>
              </TableRow>
            )}
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {category.slug}
                </TableCell>
                <TableCell>{category.displayOrder}</TableCell>
                <TableCell>{category._count?.programs ?? 0}</TableCell>
                <TableCell>
                  {category.isActive ? (
                    <Badge>Activa</Badge>
                  ) : (
                    <Badge variant="secondary">Inactiva</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      nativeButton={false}
                      render={
                        <Link
                          href={`/dashboard/categorias/${category.id}`}
                          aria-label="Editar"
                        />
                      }
                      variant="ghost"
                      size="icon-sm"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <DeleteButton
                      action={deleteCategoryAction.bind(null, category.id)}
                      confirmMessage={`¿Eliminar la categoría "${category.name}"?`}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
