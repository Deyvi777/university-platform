"use client";

import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Upload,
  UploadCloud,
} from "lucide-react";
import { useRef, useState } from "react";
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
import type { QuestionType } from "@/lib/api/me";
import type { EditQuestion } from "@/components/dashboard/quiz-manager";

// Claves locales para el editor (mismo formato que el uid del QuizManager).
let counter = 0;
const uid = () => `imp-${Date.now()}-${counter++}`;

const HEADERS = [
  "Tipo",
  "Pregunta",
  "Puntaje",
  "Respuesta correcta",
  "Opción A",
  "Opción B",
  "Opción C",
  "Opción D",
  "Opción E",
  "Opción F",
];

// Una fila de ejemplo por cada tipo de pregunta.
const EXAMPLES: string[][] = [
  [
    "Opción única",
    "¿Cuál es la capital constitucional de Bolivia?",
    "2",
    "A",
    "Sucre",
    "La Paz",
    "Cochabamba",
    "Santa Cruz",
    "",
    "",
  ],
  [
    "Opción múltiple",
    "¿Cuáles de los siguientes son departamentos de Bolivia?",
    "2",
    "A, C",
    "La Paz",
    "Lima",
    "Potosí",
    "Bogotá",
    "",
    "",
  ],
  [
    "Verdadero/Falso",
    "El lago Titicaca es el lago navegable más alto del mundo.",
    "1",
    "Verdadero",
    "",
    "",
    "",
    "",
    "",
    "",
  ],
  [
    "Respuesta corta",
    "¿En qué año se fundó Bolivia? (solo el número)",
    "1",
    "1825; mil ochocientos veinticinco",
    "",
    "",
    "",
    "",
    "",
    "",
  ],
  [
    "Ensayo",
    "Explica la importancia de la investigación científica en tu área profesional.",
    "5",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ],
];

const INSTRUCTIONS: string[][] = [
  ["Cómo llenar la plantilla de preguntas"],
  [],
  ["Columna", "Indicaciones"],
  [
    "Tipo",
    "Uno de: Opción única, Opción múltiple, Verdadero/Falso, Respuesta corta, Ensayo.",
  ],
  ["Pregunta", "El enunciado de la pregunta. Obligatorio."],
  ["Puntaje", "Puntos que vale la pregunta. Si se deja vacío, vale 1."],
  [
    "Respuesta correcta",
    "Depende del tipo — Opción única: la letra de la opción correcta (ej. A). " +
      "Opción múltiple: las letras separadas por coma (ej. A, C). " +
      "Verdadero/Falso: escribe Verdadero o Falso. " +
      "Respuesta corta: las respuestas aceptadas separadas por punto y coma (ej. 1825; mil ochocientos). " +
      "Ensayo: dejar vacío (la corrige el docente).",
  ],
  [
    "Opción A – F",
    "Solo para Opción única/múltiple: el texto de cada opción (mínimo 2). " +
      "Deja vacías las que no necesites; puedes añadir columnas Opción G, H… si requieres más (máx. 12).",
  ],
  [],
  [
    "La hoja «Preguntas» incluye una fila de ejemplo por cada tipo: reemplázalas por tus preguntas.",
  ],
  [
    "Al importar, las preguntas se agregan al editor para que las revises antes de guardarlas.",
  ],
];

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...EXAMPLES]);
  ws["!cols"] = HEADERS.map((h, i) => ({
    wch: i === 1 ? 55 : i === 3 ? 30 : Math.max(h.length, 12) + 2,
  }));
  const wsInfo = XLSX.utils.aoa_to_sheet(INSTRUCTIONS);
  wsInfo["!cols"] = [{ wch: 20 }, { wch: 110 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Preguntas");
  XLSX.utils.book_append_sheet(wb, wsInfo, "Instrucciones");
  XLSX.writeFile(wb, "plantilla-preguntas.xlsx");
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type RowError = { row: number; message: string };

/** Parsea una fila cruda del Excel. `null` = fila vacía (se ignora). */
function parseRow(row: Record<string, unknown>): EditQuestion | string | null {
  const lookup = new Map<string, string>();
  for (const [k, v] of Object.entries(row)) {
    lookup.set(normalize(k), String(v ?? "").trim());
  }
  if (![...lookup.values()].some((v) => v !== "")) return null;

  const get = (...aliases: string[]): string => {
    for (const a of aliases) {
      const v = lookup.get(a);
      if (v) return v;
    }
    return "";
  };

  const typeText = get("tipo", "tipo de pregunta");
  const prompt = get("pregunta", "enunciado");
  const pointsRaw = get("puntaje", "puntos", "puntuacion");
  const answerRaw = get(
    "respuesta correcta",
    "respuestas correctas",
    "respuestas aceptadas",
    "respuesta",
  );

  // Tipo (texto en español, tolerante a variantes)
  const t = normalize(typeText);
  let type: QuestionType | null = null;
  if (/verdadero|falso|^v ?\/ ?f$/.test(t)) type = "TRUE_FALSE";
  else if (t.includes("corta")) type = "SHORT_TEXT";
  else if (/ensayo|abierta/.test(t)) type = "ESSAY";
  else if (t.includes("varias")) type = "MULTIPLE_CHOICE";
  else if (/unica|una/.test(t)) type = "SINGLE_CHOICE";
  else if (t.includes("multiple")) type = "MULTIPLE_CHOICE";
  if (!type) {
    return typeText
      ? `Tipo no reconocido: «${typeText}». Usa: Opción única, Opción múltiple, Verdadero/Falso, Respuesta corta o Ensayo.`
      : "Falta el Tipo de pregunta.";
  }

  if (!prompt) return "Falta el enunciado (columna Pregunta).";

  let points = 1;
  if (pointsRaw !== "") {
    points = Number(pointsRaw.replace(",", "."));
    if (!Number.isFinite(points) || points < 0) {
      return `Puntaje inválido: «${pointsRaw}».`;
    }
  }

  const base: EditQuestion = {
    key: uid(),
    type,
    prompt,
    points: String(points),
    boolAnswer: true,
    acceptedText: "",
    // Dos opciones en blanco de cortesía (ignoradas al guardar en tipos sin
    // opciones), por si el docente cambia el tipo en el editor.
    options: [
      { key: uid(), text: "", isCorrect: true },
      { key: uid(), text: "", isCorrect: false },
    ],
  };

  if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") {
    // Opciones por letra de columna ("Opción A" → a), respetando huecos.
    const present: { letter: string; text: string }[] = [];
    for (const [k, v] of lookup) {
      const m = /^opcion ([a-l])$/.exec(k);
      if (m && v !== "") present.push({ letter: m[1], text: v });
    }
    present.sort((a, b) => a.letter.localeCompare(b.letter));
    if (present.length < 2) {
      return "Una pregunta de opción necesita al menos 2 opciones (columnas Opción A, B…).";
    }

    const tokens = answerRaw
      .split(/[,;/\s]+/)
      .map(normalize)
      .filter(Boolean);
    if (tokens.length === 0) {
      return "Indica la(s) letra(s) correcta(s) en Respuesta correcta (ej. A o A, C).";
    }
    const letters = new Set<string>();
    for (const tok of tokens) {
      if (!/^[a-l]$/.test(tok)) {
        return `Respuesta correcta inválida: «${tok}». Usa la letra de la opción (ej. A o A, C).`;
      }
      if (!present.some((o) => o.letter === tok)) {
        return `La opción «${tok.toUpperCase()}» marcada como correcta está vacía o no existe.`;
      }
      letters.add(tok);
    }
    if (type === "SINGLE_CHOICE" && letters.size > 1) {
      return "Una pregunta de Opción única solo puede tener una letra correcta.";
    }
    base.options = present.map((o) => ({
      key: uid(),
      text: o.text,
      isCorrect: letters.has(o.letter),
    }));
  }

  if (type === "TRUE_FALSE") {
    const a = normalize(answerRaw);
    if (/^(v|verdadero|true|si)$/.test(a)) base.boolAnswer = true;
    else if (/^(f|falso|false|no)$/.test(a)) base.boolAnswer = false;
    else {
      return "En Respuesta correcta escribe «Verdadero» o «Falso».";
    }
  }

  if (type === "SHORT_TEXT") {
    const accepted = answerRaw
      .split(/[;|\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (accepted.length === 0) {
      return "Agrega al menos una respuesta aceptada en Respuesta correcta (sepáralas con punto y coma).";
    }
    base.acceptedText = accepted.join("\n");
  }

  return base;
}

export function QuizBulkImport({
  onImport,
}: {
  onImport: (questions: EditQuestion[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<EditQuestion[]>([]);
  const [errors, setErrors] = useState<RowError[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFileName(null);
    setParsed([]);
    setErrors([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file: File) {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      // Usa la hoja "Preguntas" si existe (la plantilla trae también
      // "Instrucciones"); si no, la primera.
      const name =
        wb.SheetNames.find((n) => normalize(n) === "preguntas") ??
        wb.SheetNames[0];
      const sheet = name ? wb.Sheets[name] : undefined;
      if (!sheet) {
        toast.error("El archivo no tiene hojas.");
        return;
      }
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: false,
      });
      const questions: EditQuestion[] = [];
      const errs: RowError[] = [];
      rows.forEach((row, i) => {
        const res = parseRow(row);
        if (res === null) return; // fila vacía
        if (typeof res === "string") {
          errs.push({ row: i + 2, message: res }); // +2: encabezado + base 1
        } else {
          questions.push(res);
        }
      });
      setFileName(file.name);
      setParsed(questions);
      setErrors(errs);
      if (questions.length === 0 && errs.length === 0) {
        toast.error("No se encontraron filas con datos en el archivo.");
      }
    } catch {
      toast.error("No se pudo leer el archivo. ¿Es un Excel válido?");
    }
  }

  function handleImport() {
    if (parsed.length === 0) return;
    onImport(parsed);
    toast.success(
      `${parsed.length} pregunta${parsed.length === 1 ? "" : "s"} agregada${parsed.length === 1 ? "" : "s"} al editor — revísalas y pulsa «Guardar preguntas».`,
    );
    setOpen(false);
    reset();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <UploadCloud className="size-4" aria-hidden="true" /> Importar desde
        Excel
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
            <DialogTitle>Carga masiva de preguntas</DialogTitle>
            <DialogDescription>
              Descarga la plantilla, llénala y súbela para agregar varias
              preguntas a la vez. Podrás revisarlas antes de guardar.
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
                  Incluye una fila de ejemplo por cada tipo de pregunta y una
                  hoja de <span className="font-medium">Instrucciones</span> con
                  el formato de la columna{" "}
                  <span className="font-medium">Respuesta correcta</span> según
                  el tipo.
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
                — {parsed.length} pregunta{parsed.length === 1 ? "" : "s"}{" "}
                válida{parsed.length === 1 ? "" : "s"}
                {errors.length > 0 &&
                  `, ${errors.length} fila${errors.length === 1 ? "" : "s"} con errores`}
                .
              </p>
            )}
          </div>

          {/* Errores por fila */}
          {errors.length > 0 && (
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle
                  className="size-5 text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
                Filas con errores ({errors.length}) — no se importarán
              </div>
              <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs">
                {errors.map((err) => (
                  <li
                    key={err.row}
                    className="rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-destructive"
                  >
                    <span className="font-medium">Fila {err.row}</span> —{" "}
                    {err.message}
                  </li>
                ))}
              </ul>
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
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={parsed.length === 0}
            >
              Agregar {parsed.length > 0 ? parsed.length : ""} pregunta
              {parsed.length === 1 ? "" : "s"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
