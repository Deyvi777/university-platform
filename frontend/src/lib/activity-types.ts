import {
  ClipboardList,
  FolderKanban,
  type LucideIcon,
  MessagesSquare,
  ListChecks,
  Timer,
} from "lucide-react";
import type { ActivityType } from "@/lib/api/me";

/**
 * Registro central de los tipos de actividad (LMS). Cada tipo tiene su propia
 * naturaleza y comportamiento (ver CLAUDE.md → Academia/LMS):
 * - ASSIGNMENT (Tarea): entrega simple (texto + 1 archivo).
 * - PROJECT (Proyecto): entrega grande con varios archivos.
 * - FORUM (Foro): hilo de discusión público del módulo, nota por participación.
 * - QUIZ (Cuestionario) / EXAM (Examen): motor de preguntas autocalificable;
 *   el Examen añade cronómetro, ventana, intento único y barajado.
 *
 * `tint` es la clase del badge/ícono (fondo + texto, claro y oscuro). Igual que
 * `course-icons.ts`/`NAV_ICONS`, se **indexa** este registro (no se deriva el
 * componente con una función en render — regla `react-hooks/static-components`).
 */
export const ACTIVITY_TYPES: Record<
  ActivityType,
  {
    label: string;
    Icon: LucideIcon;
    /** Clase del badge redondo con el ícono (fondo + texto). */
    tint: string;
    /** Qué es, para el selector de creación. */
    description: string;
    /** Pista para el docente dentro del formulario. */
    helpCopy: string;
  }
> = {
  ASSIGNMENT: {
    label: "Tarea",
    Icon: ClipboardList,
    tint: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    description: "Entrega simple: el estudiante sube un texto y/o un archivo.",
    helpCopy:
      "El estudiante entrega un texto y/o un archivo. Tú la calificas manualmente.",
  },
  PROJECT: {
    label: "Proyecto",
    Icon: FolderKanban,
    tint: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    description: "Entrega grande: el estudiante puede subir varios archivos.",
    helpCopy:
      "El estudiante adjunta varios archivos (entregable extenso). Tú lo calificas manualmente.",
  },
  FORUM: {
    label: "Foro",
    Icon: MessagesSquare,
    tint: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    description:
      "Hilo de discusión público: todos publican y se responden entre sí.",
    helpCopy:
      "Se abre un hilo de discusión del módulo. Calificas la participación de cada estudiante.",
  },
  QUIZ: {
    label: "Cuestionario",
    Icon: ListChecks,
    tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    description:
      "Preguntas que se autocalifican (opción múltiple, V/F, respuesta corta, ensayo).",
    helpCopy:
      "Arma las preguntas; el estudiante las responde en línea y la plataforma califica sola (los ensayos los corriges tú).",
  },
  EXAM: {
    label: "Examen",
    Icon: Timer,
    tint: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    description:
      "Cuestionario con controles: cronómetro, ventana de tiempo, intento único y barajado.",
    helpCopy:
      "Como el cuestionario, pero con cronómetro, ventana de disponibilidad, intento único y preguntas barajadas.",
  },
};

/** Lista ordenada para el selector de tipo de actividad. */
export const ACTIVITY_TYPE_OPTIONS = (
  ["ASSIGNMENT", "PROJECT", "FORUM", "QUIZ", "EXAM"] as ActivityType[]
).map((key) => ({ key, ...ACTIVITY_TYPES[key] }));

/** Tipos que usan el motor de preguntas (constructor + resolución). */
export const QUIZ_TYPES: ActivityType[] = ["QUIZ", "EXAM"];

/** ¿Este tipo usa el motor de preguntas? */
export function isQuizType(type: ActivityType): boolean {
  return type === "QUIZ" || type === "EXAM";
}
