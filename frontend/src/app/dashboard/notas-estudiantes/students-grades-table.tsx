"use client";

import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  GraduationCap,
  Search,
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
import type { AdminUser } from "@/lib/api/admin";
import { WhatsAppButton } from "@/app/dashboard/usuarios/whatsapp-button";
import {
  StudentKardexButton,
  StudentNotesButton,
} from "./student-grade-dialogs";

type SortKey = "name" | "email" | "idDocument";
type SortDir = "asc" | "desc";

function sortValue(user: AdminUser, key: SortKey): string {
  switch (key) {
    case "name":
      return `${user.lastName} ${user.firstName}`.toLowerCase();
    case "email":
      return user.email.toLowerCase();
    case "idDocument":
      return (user.idDocument ?? "").toLowerCase();
  }
}

/** Normaliza para buscar sin distinguir mayúsculas ni acentos. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function StudentGradesTable({ students }: { students: AdminUser[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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
      ? students.filter(
          (u) =>
            normalize(`${u.lastName} ${u.firstName}`).includes(q) ||
            normalize(u.email).includes(q) ||
            normalize(u.idDocument ?? "").includes(q),
        )
      : students;
    return [...filtered].sort((a, b) => {
      const cmp = sortValue(a, sortKey).localeCompare(
        sortValue(b, sortKey),
        "es",
      );
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [students, query, sortKey, sortDir]);

  const noStudents = students.length === 0;
  const count = students.length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Notas de estudiantes
          </h1>
          <p className="mt-1 text-muted-foreground">
            {count} {count === 1 ? "estudiante" : "estudiantes"}. Consulta sus
            notas y kárdex, con descarga en PDF.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por apellido, nombre, correo o documento…"
            aria-label="Buscar estudiante"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                label="Apellidos y nombre"
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
                label="Documento"
                column="idDocument"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {noStudents && (
              <TableRow>
                <TableCell colSpan={4} className="py-14">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span
                      className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
                      aria-hidden="true"
                    >
                      <GraduationCap className="size-5" />
                    </span>
                    <p className="font-medium">Aún no hay estudiantes.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!noStudents && visible.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-14 text-center text-muted-foreground"
                >
                  No se encontraron resultados para «{query.trim()}».
                </TableCell>
              </TableRow>
            )}

            {visible.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">
                  {student.lastName} {student.firstName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {student.email}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {student.idDocument ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <WhatsAppButton
                      phone={student.phone}
                      name={`${student.lastName} ${student.firstName}`}
                    />
                    <StudentNotesButton student={student} />
                    <StudentKardexButton student={student} />
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
