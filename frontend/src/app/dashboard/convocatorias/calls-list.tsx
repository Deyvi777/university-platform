"use client";

import Link from "next/link";
import { Eye, FileText, Pencil } from "lucide-react";
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
import type { AdminCallListItem } from "@/lib/api/admin";
import { callStatus, formatCallDate } from "@/lib/api/calls";
import { deleteCallAction } from "./actions";

export function CallsList({ calls }: { calls: AdminCallListItem[] }) {
  if (!calls.length) {
    return (
      <div className="mt-6 rounded-2xl border bg-card p-10 text-center text-muted-foreground shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        Aún no hay convocatorias. Crea la primera.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Convocatoria</TableHead>
            <TableHead>Vigencia</TableHead>
            <TableHead>Formulario</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => (
            <TableRow key={call.id}>
              <TableCell className="max-w-sm font-medium">
                <Link
                  href={`/dashboard/convocatorias/${call.id}/postulaciones`}
                  className="transition-colors hover:text-primary hover:underline"
                >
                  {call.title}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {call.closesAt
                  ? `Cierra ${formatCallDate(call.closesAt)}`
                  : "Sin fecha límite"}
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {call._count.questions} preguntas · {call._count.applications}{" "}
                  postulaciones
                </span>
              </TableCell>
              <TableCell>
                {!call.isPublished ? (
                  <Badge variant="secondary">Borrador</Badge>
                ) : callStatus(call) === "ABIERTA" ? (
                  <Badge>Abierta</Badge>
                ) : (
                  <Badge variant="secondary">
                    {callStatus(call) === "PRÓXIMA" ? "Próxima" : "Cerrada"}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    nativeButton={false}
                    render={
                      <Link
                        href={`/convocatorias/${call.slug}`}
                        target="_blank"
                        aria-label="Ver página pública"
                      />
                    }
                    variant="ghost"
                    size="icon-sm"
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    nativeButton={false}
                    render={
                      <Link
                        href={`/dashboard/convocatorias/${call.id}/postulaciones`}
                        aria-label={`Ver ${call._count.applications} postulaciones de ${call.title}`}
                      />
                    }
                    variant="outline"
                    size="icon-sm"
                    className="border-sky-500/30 bg-sky-500/10 text-sky-700 shadow-sm hover:border-sky-500/50 hover:bg-sky-500/20 dark:text-sky-300"
                  >
                    <FileText className="size-4" />
                  </Button>
                  <Button
                    nativeButton={false}
                    render={
                      <Link
                        href={`/dashboard/convocatorias/${call.id}`}
                        aria-label="Editar"
                      />
                    }
                    variant="ghost"
                    size="icon-sm"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <DeleteButton
                    action={deleteCallAction.bind(null, call.id)}
                    confirmMessage={`¿Eliminar "${call.title}"? Solo puede eliminarse si no tiene postulaciones.`}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
