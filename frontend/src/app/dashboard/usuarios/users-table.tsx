"use client";

import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DeleteButton } from "@/components/admin/delete-button";
import type { AdminUser } from "@/lib/api/admin";
import { deleteUserAction } from "@/app/dashboard/usuarios/actions";
import { RoleBadge, StatusBadge } from "@/app/dashboard/usuarios/user-badges";
import {
  CreateUserButton,
  EditUserButton,
} from "@/app/dashboard/usuarios/user-dialogs";
import { WhatsAppButton } from "@/app/dashboard/usuarios/whatsapp-button";
import { BulkUploadStudents } from "@/app/dashboard/usuarios/bulk-upload-students";
import type { UserFormRole } from "@/app/dashboard/usuarios/user-schema";

const dateFmt = new Intl.DateTimeFormat("es-BO", {
  timeZone: "UTC",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type SortKey = "name" | "email" | "role" | "status" | "createdAt";
type SortDir = "asc" | "desc";

/** Orden de roles para ordenar la columna "Rol" de forma estable. */
const ROLE_RANK: Record<AdminUser["role"], number> = {
  ADMIN: 0,
  PROFESSOR: 1,
  STUDENT: 2,
};

/** Valor comparable por columna. */
function sortValue(user: AdminUser, key: SortKey): string | number {
  switch (key) {
    case "name":
      return `${user.firstName} ${user.lastName}`.toLowerCase();
    case "email":
      return user.email.toLowerCase();
    case "role":
      return ROLE_RANK[user.role];
    case "status":
      return user.isActive ? 1 : 0;
    case "createdAt":
      return new Date(user.createdAt).getTime();
  }
}

/** Normaliza para buscar sin distinguir mayúsculas ni acentos. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function UsersTable({
  users,
  canCreate,
  createRole,
  createLabel,
  emptyTitle,
  title,
  subtitle,
  showReadOnlyNotice = false,
  showBulkUpload = false,
}: {
  users: AdminUser[];
  canCreate: boolean;
  createRole: UserFormRole;
  createLabel: string;
  emptyTitle: string;
  title: string;
  subtitle: string;
  showReadOnlyNotice?: boolean;
  /** Muestra el botón de carga masiva (solo en la sección de estudiantes). */
  showBulkUpload?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    const filtered = q
      ? users.filter((u) =>
          normalize(`${u.firstName} ${u.lastName}`).includes(q),
        )
      : users;
    const sorted = [...filtered].sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      let cmp: number;
      if (typeof va === "number" && typeof vb === "number") {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb), "es");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [users, query, sortKey, sortDir]);

  const noUsers = users.length === 0;

  return (
    <div>
      {/* Encabezado: título + buscador y botón de crear en la fila superior. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o apellido…"
              aria-label="Buscar por nombre o apellido"
              className="pl-9"
            />
          </div>
          {showBulkUpload && <BulkUploadStudents />}
          {canCreate && (
            <CreateUserButton defaultRole={createRole} label={createLabel} />
          )}
        </div>
      </div>

      {/* Aviso de solo-lectura para administrativos. */}
      {showReadOnlyNotice && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Las cuentas administrativas se gestionan de forma interna. Desde aquí
          puedes consultarlas, pero no crear nuevas.
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                label="Nombre"
                column="name"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableHead
                label="Correo"
                column="email"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableHead
                label="Rol"
                column="role"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableHead
                label="Estado"
                column="status"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableHead
                label="Creado"
                column="createdAt"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {noUsers && (
              <TableRow>
                <TableCell colSpan={6} className="py-14">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span
                      className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
                      aria-hidden="true"
                    >
                      <Users className="size-5" />
                    </span>
                    <div>
                      <p className="font-medium">{emptyTitle}</p>
                      {canCreate && (
                        <p className="text-sm text-muted-foreground">
                          Crea el primero para empezar.
                        </p>
                      )}
                    </div>
                    {canCreate && (
                      <CreateUserButton
                        defaultRole={createRole}
                        label={createLabel}
                        size="sm"
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!noUsers && visible.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-14 text-center text-muted-foreground"
                >
                  No se encontraron resultados para «{query.trim()}».
                </TableCell>
              </TableRow>
            )}

            {visible.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell>
                  <StatusBadge isActive={user.isActive} />
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {dateFmt.format(new Date(user.createdAt))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <WhatsAppButton
                      phone={user.phone}
                      name={`${user.firstName} ${user.lastName}`}
                    />
                    <EditUserButton user={user} />
                    <DeleteButton
                      action={deleteUserAction.bind(null, user.id)}
                      confirmMessage={`¿Eliminar a "${user.firstName} ${user.lastName}"? Esta acción no se puede deshacer.`}
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

/** Encabezado con botón para ordenar asc/desc por esa columna. */
function SortableHead({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === column;
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(column)}
        aria-label={`Ordenar por ${label}`}
        className={cn(
          "-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {!active ? (
          <ChevronsUpDown className="size-3.5 opacity-60" aria-hidden="true" />
        ) : sortDir === "asc" ? (
          <ChevronUp className="size-3.5" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-3.5" aria-hidden="true" />
        )}
      </button>
    </TableHead>
  );
}
