"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  UploadCloud,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BulkUploadResult } from "@/app/dashboard/admin-types";
import { bulkCreateStudentsAction } from "@/app/dashboard/usuarios/actions";

/** Una fila de estudiante tras parsear el Excel. */
type ParsedStudent = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idDocument: string;
  issuedIn: string;
  gender: string;
  originUniversity: string;
  profession: string;
};

/**
 * Columnas de la plantilla. `header` es el rótulo visible/del ejemplo; `aliases`
 * (ya normalizados, sin acentos) permiten reconocer variantes al parsear.
 */
const COLUMNS: {
  key: keyof ParsedStudent;
  header: string;
  example: string;
  aliases: string[];
}[] = [
  {
    key: "lastName",
    header: "Apellido",
    example: "Pérez",
    aliases: ["apellido", "apellidos"],
  },
  {
    key: "firstName",
    header: "Nombre",
    example: "Juan",
    aliases: ["nombre", "nombres"],
  },
  {
    key: "idDocument",
    header: "Documento de identidad",
    example: "1234567",
    aliases: ["documento de identidad", "documento", "carnet", "ci", "cedula"],
  },
  {
    key: "issuedIn",
    header: "Expedido en",
    example: "La Paz",
    aliases: ["expedido en", "expedido", "lugar de expedicion", "expedicion"],
  },
  {
    key: "gender",
    header: "Género (Masculino/Femenino)",
    example: "Masculino",
    aliases: ["genero", "genero (masculino/femenino)", "sexo"],
  },
  {
    key: "phone",
    header: "Teléfono",
    example: "71234567",
    aliases: ["telefono", "celular", "telefono/celular"],
  },
  {
    key: "email",
    header: "Correo electrónico",
    example: "juan.perez@ejemplo.com",
    aliases: ["correo electronico", "correo", "email", "e-mail"],
  },
  {
    key: "originUniversity",
    header: "Universidad de origen",
    example: "Universidad Mayor de San Andrés",
    aliases: ["universidad de origen", "universidad", "universidad origen"],
  },
  {
    key: "profession",
    header: "Profesión",
    example: "Ingeniería de Sistemas",
    aliases: ["profesion", "profesión", "carrera"],
  },
];

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function downloadTemplate() {
  const headers = COLUMNS.map((c) => c.header);
  const example = COLUMNS.map((c) => c.example);
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = COLUMNS.map((c) => ({
    wch: Math.max(c.header.length, c.example.length, 14) + 2,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
  XLSX.writeFile(wb, "plantilla-estudiantes.xlsx");
}

/** Convierte una fila cruda del Excel (claves = encabezados) a `ParsedStudent`. */
function mapRow(row: Record<string, unknown>): ParsedStudent | null {
  const lookup = new Map<string, unknown>();
  for (const [k, v] of Object.entries(row)) lookup.set(normalizeHeader(k), v);

  const get = (aliases: string[]): string => {
    for (const a of aliases) {
      const v = lookup.get(a);
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        return String(v).trim();
      }
    }
    return "";
  };

  // Búsqueda de alias por clave (no por índice) para no depender del orden de
  // las columnas en la plantilla.
  const aliasesFor = (key: keyof ParsedStudent): string[] =>
    COLUMNS.find((c) => c.key === key)?.aliases ?? [];

  const student: ParsedStudent = {
    firstName: get(aliasesFor("firstName")),
    lastName: get(aliasesFor("lastName")),
    email: get(aliasesFor("email")),
    phone: get(aliasesFor("phone")),
    idDocument: get(aliasesFor("idDocument")),
    issuedIn: get(aliasesFor("issuedIn")),
    gender: get(aliasesFor("gender")),
    originUniversity: get(aliasesFor("originUniversity")),
    profession: get(aliasesFor("profession")),
  };

  // Ignora filas totalmente vacías (p. ej. la fila de ejemplo borrada a medias).
  const hasAny = Object.values(student).some((v) => v !== "");
  return hasAny ? student : null;
}

export function BulkUploadStudents() {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<ParsedStudent[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStudents([]);
    setFileName(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file: File) {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) {
        toast.error("El archivo no tiene hojas.");
        return;
      }
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: false,
      });
      const parsed = rows
        .map(mapRow)
        .filter((r): r is ParsedStudent => r !== null);
      setResult(null);
      setFileName(file.name);
      setStudents(parsed);
      if (parsed.length === 0) {
        toast.error("No se encontraron filas con datos en el archivo.");
      }
    } catch {
      toast.error("No se pudo leer el archivo. ¿Es un Excel válido?");
    }
  }

  function handleSubmit() {
    if (students.length === 0) return;
    startTransition(async () => {
      const res = await bulkCreateStudentsAction(students);
      if (res.ok) {
        setResult(res.data);
        if (res.data.created > 0) {
          toast.success(
            `${res.data.created} estudiante${res.data.created === 1 ? "" : "s"} registrado${res.data.created === 1 ? "" : "s"}`,
          );
        }
        if (res.data.errors.length > 0) {
          toast.error(
            `${res.data.errors.length} fila${res.data.errors.length === 1 ? "" : "s"} con errores`,
          );
        }
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <UploadCloud className="size-4" aria-hidden="true" /> Carga masiva
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carga masiva de estudiantes</DialogTitle>
            <DialogDescription>
              Descarga la plantilla, llénala y súbela para registrar varios
              estudiantes a la vez.
            </DialogDescription>
          </DialogHeader>

          {/* Paso 1: plantilla */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                aria-hidden="true"
              >
                <FileSpreadsheet className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">1. Descarga la plantilla</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Incluye una fila de ejemplo. El{" "}
                  <span className="font-medium">Documento de identidad</span> es
                  obligatorio: con él se genera la contraseña automáticamente
                  (inicial del nombre + inicial del apellido + documento). En{" "}
                  <span className="font-medium">Género</span> escribe
                  «Masculino» o «Femenino» (si se deja vacío se asume
                  Masculino). Expedido en, Universidad de origen y Profesión son
                  opcionales.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={downloadTemplate}
                >
                  <Download className="size-4" aria-hidden="true" /> Descargar
                  plantilla (.xlsx)
                </Button>
              </div>
            </div>
          </div>

          {/* Paso 2: subir */}
          <div className="rounded-xl border p-4">
            <p className="text-sm font-medium">2. Sube el archivo lleno</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-4" aria-hidden="true" /> Seleccionar
              archivo
            </Button>
            {fileName && (
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{fileName}</span>{" "}
                — {students.length} estudiante{students.length === 1 ? "" : "s"}{" "}
                detectado{students.length === 1 ? "" : "s"}.
              </p>
            )}
          </div>

          {/* Resultado de la carga */}
          {result && (
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                {result.created > 0 ? (
                  <CheckCircle2
                    className="size-5 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertTriangle
                    className="size-5 text-amber-600 dark:text-amber-400"
                    aria-hidden="true"
                  />
                )}
                {result.created} de {result.total} estudiantes registrados
              </div>
              {result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Filas con errores ({result.errors.length}):
                  </p>
                  <ul className="mt-1.5 max-h-48 space-y-1 overflow-auto text-xs">
                    {result.errors.map((err) => (
                      <li
                        key={err.index}
                        className="rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-destructive"
                      >
                        <span className="font-medium">
                          Fila {err.index + 2}
                        </span>
                        {err.email ? ` · ${err.email}` : ""} — {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              {result ? "Cerrar" : "Cancelar"}
            </Button>
            {!result && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={pending || students.length === 0}
              >
                {pending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                Registrar {students.length > 0 ? students.length : ""} estudiante
                {students.length === 1 ? "" : "s"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
