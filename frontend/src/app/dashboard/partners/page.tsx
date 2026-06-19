import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { listAdminPartners } from "@/lib/api/admin";
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
import { deletePartnerAction } from "@/app/dashboard/partners/actions";

export default async function PartnersAdminPage() {
  await requireAdmin();
  const partners = await listAdminPartners();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Instituciones aliadas
          </h1>
          <p className="mt-1 text-muted-foreground">
            {partners.length}{" "}
            {partners.length === 1 ? "institución" : "instituciones"}{" "}
            registradas.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/partners/nuevo" />}
        >
          <Plus className="size-4" /> Nueva institución
        </Button>
      </div>

      <div className="mt-6 rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Logo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  Aún no hay instituciones. Crea la primera.
                </TableCell>
              </TableRow>
            )}
            {partners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell>
                  <div className="flex size-12 items-center justify-center rounded-md bg-slate-900 p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={partner.logoUrl}
                      alt={partner.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{partner.name}</TableCell>
                <TableCell>{partner.displayOrder}</TableCell>
                <TableCell>
                  {partner.isPublished ? (
                    <Badge>Publicado</Badge>
                  ) : (
                    <Badge variant="secondary">Oculto</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      nativeButton={false}
                      render={
                        <Link
                          href={`/dashboard/partners/${partner.id}`}
                          aria-label="Editar"
                        />
                      }
                      variant="ghost"
                      size="icon-sm"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <DeleteButton
                      action={deletePartnerAction.bind(null, partner.id)}
                      confirmMessage={`¿Eliminar "${partner.name}"?`}
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
