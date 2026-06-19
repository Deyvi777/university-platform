import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { listAdminPrograms } from "@/lib/api/admin";
import { formatStartDate } from "@/lib/api/programs";
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
import { deleteProgramAction } from "@/app/dashboard/programas/actions";

export default async function ProgramasAdminPage() {
  await requireAdmin();
  const programs = await listAdminPrograms();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programas</h1>
          <p className="mt-1 text-muted-foreground">
            {programs.length}{" "}
            {programs.length === 1 ? "programa" : "programas"} registrados.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/programas/nuevo" />}
        >
          <Plus className="size-4" /> Nuevo programa
        </Button>
      </div>

      <div className="mt-6 rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  Aún no hay programas. Crea el primero.
                </TableCell>
              </TableRow>
            )}
            {programs.map((program) => (
              <TableRow key={program.id}>
                <TableCell className="font-medium">{program.title}</TableCell>
                <TableCell>{program.category.name}</TableCell>
                <TableCell>{formatStartDate(program.startDate)}</TableCell>
                <TableCell>
                  {program.isPublished ? (
                    <Badge>Publicado</Badge>
                  ) : (
                    <Badge variant="secondary">Borrador</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      nativeButton={false}
                      render={
                        <Link
                          href={`/dashboard/programas/${program.id}`}
                          aria-label="Editar"
                        />
                      }
                      variant="ghost"
                      size="icon-sm"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <DeleteButton
                      action={deleteProgramAction.bind(null, program.id)}
                      confirmMessage={`¿Eliminar "${program.title}"? Esta acción no se puede deshacer.`}
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
