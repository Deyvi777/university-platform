"use client";

import { Loader2, Search, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/admin/delete-button";
import { WhatsAppButton } from "@/app/dashboard/usuarios/whatsapp-button";
import type { AdminEnrollmentRequest } from "@/lib/api/admin";
import {
  deleteRequestAction,
  enrollRequestAction,
} from "@/app/dashboard/solicitudes/actions";

const GENDER_LABEL: Record<AdminEnrollmentRequest["gender"], string> = {
  MALE: "Masculino",
  FEMALE: "Femenino",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function RequestsTable({
  requests,
}: {
  requests: AdminEnrollmentRequest[];
}) {
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();
  const filtered = term
    ? requests.filter((r) =>
        [
          r.lastName,
          r.firstName,
          `${r.lastName} ${r.firstName}`,
          r.email,
          r.idDocument,
          r.programTitle,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
    : requests;

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por apellido, nombre, correo, documento o programa…"
          aria-label="Buscar solicitudes"
          className="pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Apellidos y nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  {requests.length === 0
                    ? "Aún no hay solicitudes de inscripción."
                    : "Sin resultados para la búsqueda."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(request.createdAt)}
                </TableCell>
                <TableCell className="font-medium">
                  {request.lastName} {request.firstName}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{request.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {request.phone}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{request.idDocument}</div>
                  <div className="text-xs text-muted-foreground">
                    Exp. {request.issuedIn}
                  </div>
                </TableCell>
                <TableCell className="max-w-56">
                  <span className="line-clamp-2">{request.programTitle}</span>
                </TableCell>
                <TableCell>
                  {request.status === "ENROLLED" ? (
                    <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
                      Inscrito
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                      Pendiente
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <WhatsAppButton
                      phone={request.phone}
                      name={`${request.lastName} ${request.firstName}`}
                    />
                    {request.status === "PENDING" && (
                      <EnrollButton request={request} />
                    )}
                    <DeleteButton
                      action={deleteRequestAction.bind(null, request.id)}
                      title="¿Eliminar esta solicitud?"
                      confirmMessage={`Se eliminará la solicitud de ${request.lastName} ${request.firstName}. Esta acción no crea ni borra cuentas.`}
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

/**
 * Convierte la solicitud en cuenta STUDENT: muestra un resumen de los datos y
 * confirma que la contraseña se genera sola y se envía por correo (igual que
 * el alta manual de un estudiante).
 */
function EnrollButton({ request }: { request: AdminEnrollmentRequest }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const result = await enrollRequestAction(request.id);
      if (result.ok) {
        toast.success(
          "Estudiante inscrito. Las credenciales se enviaron por correo.",
        );
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const summary: Array<[string, string]> = [
    ["Apellidos y nombre", `${request.lastName} ${request.firstName}`],
    ["Correo", request.email],
    ["Teléfono", request.phone],
    ["Documento", `${request.idDocument} (Exp. ${request.issuedIn})`],
    ["Género", GENDER_LABEL[request.gender]],
    ["Universidad de origen", request.originUniversity],
    ["Profesión", request.profession],
    ["Programa", request.programTitle],
  ];

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
      }}
    >
      <AlertDialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <UserPlus className="size-4" /> Inscribir
          </Button>
        }
      />
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <UserPlus aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>¿Inscribir a este estudiante?</AlertDialogTitle>
          <AlertDialogDescription>
            Se creará su cuenta de estudiante con los datos de la solicitud. La
            contraseña se genera automáticamente y se envía por correo, igual
            que al crear un estudiante nuevo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <dl className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border bg-muted/40 p-4 text-sm">
          {summary.map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-40 shrink-0 text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction type="button" disabled={pending} onClick={onConfirm}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Inscribiendo…
              </>
            ) : (
              <>
                <UserPlus className="size-4" aria-hidden="true" />
                Inscribir estudiante
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
