import { auth } from "@/auth";
import type {
  ActivityType,
  MaterialType,
  ModuleGradeStatus,
  ModuleStatus,
  SubmissionStatus,
} from "@/lib/api/me";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export type { ActivityType, MaterialType };
export type { RecoveryStage } from "@/lib/api/me";

/** Tipo de un contenido del temario. */
export type ContentKind =
  | "TEXT"
  | "VIDEO"
  | "MATERIAL"
  | "ACTIVITY"
  | "FOLDER";

/** Archivo dentro de una carpeta (kind = FOLDER). */
export interface FolderFile {
  id: string;
  name: string;
  url: string;
  size: number | null;
}

/**
 * Un contenido del módulo (entrada del temario). Los campos específicos del
 * tipo solo aplican según `kind` (el resto llega `null`).
 */
export interface TeacherContent {
  id: string;
  order: number;
  kind: ContentKind;
  title: string;
  isPublished: boolean;
  // TEXT
  body: string | null;
  // VIDEO
  videoUrl: string | null;
  // MATERIAL
  materialType: "FILE" | "LINK" | null;
  url: string | null;
  // ACTIVITY
  activityType: ActivityType | null;
  instructions: string | null;
  dueDate: string | null;
  maxScore: number | null;
  weight: number | null;
  /** Actividad presencial: se califica a mano en la libreta, sin entrega. */
  isOffline: boolean;
  // QUIZ/EXAM — ajustes del motor de preguntas.
  timeLimitMin: number | null;
  availableFrom: string | null;
  availableUntil: string | null;
  singleAttempt: boolean | null;
  shuffle: boolean | null;
  revealAnswers: boolean | null;
  /** Examen de recuperación: la nota final es la mayor entre módulo y examen (tope: nota de aprobación). */
  recoveryStage: "RECUPERATORIO" | "SEGUNDA_INSTANCIA" | null;
  /** Archivos contenidos (solo kind = FOLDER). */
  folderFiles?: FolderFile[];
  /** Nº de entregas de estudiantes (solo kind = ACTIVITY; para avisar al borrar). */
  submissionCount: number;
}

export interface TeacherModule {
  id: string;
  order: number;
  name: string;
  description: string | null;
  status: ModuleStatus;
  credits: number | null;
  course: { id: string; name: string; code: string };
  contents: TeacherContent[];
}

export interface GradingStudentRow {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  submission: {
    content: string | null;
    fileUrl: string | null;
    /** Historial de entregas de un Proyecto (vacío en Tarea). */
    deliveries: {
      order: number;
      text: string | null;
      submittedAt: string | null;
      files: { name: string; url: string; size: number | null }[];
    }[];
    status: SubmissionStatus;
    score: number | null;
    feedback: string | null;
    submittedAt: string | null;
  } | null;
}

export interface ActivityGrading {
  activity: {
    id: string;
    title: string;
    type: ActivityType;
    instructions: string | null;
    maxScore: number;
    weight: number;
    dueDate: string | null;
    /** Examen de recuperación: la nota final es la mayor entre módulo y examen (tope: nota de aprobación). */
    recoveryStage: "RECUPERATORIO" | "SEGUNDA_INSTANCIA" | null;
    module: { id: string; name: string; order: number; status: ModuleStatus };
    course: { id: string; name: string };
  };
  students: GradingStudentRow[];
}

/**
 * Datos para calificar una actividad: la actividad + los estudiantes inscritos
 * con su entrega. `null` si la actividad no existe o el docente no la dicta.
 */
export async function getActivityGrading(
  activityId: string,
): Promise<ActivityGrading | null> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return null;

  const res = await fetch(
    `${API_URL}/me/activities/${encodeURIComponent(activityId)}/grading`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  return (await res.json()) as ActivityGrading;
}

export class MeApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "MeApiError";
  }
}

/**
 * Módulo con su contenido para gestión del docente. Devuelve `null` si no existe
 * o el docente no lo dicta (→ `notFound()` en la página).
 */
export async function getTeacherModule(
  moduleId: string,
): Promise<TeacherModule | null> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return null;

  const res = await fetch(
    `${API_URL}/me/modules/${encodeURIComponent(moduleId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  return (await res.json()) as TeacherModule;
}

/**
 * Mutación autenticada contra `/me/...` con el token de la sesión. Usado por los
 * server actions del panel docente. Lanza `MeApiError` con el mensaje del backend.
 */
export async function mutateMe<T>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) throw new MeApiError(401, "No autenticado");

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(data.message)) message = data.message.join(", ");
      else if (data.message) message = data.message;
    } catch {
      // sin cuerpo JSON
    }
    throw new MeApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

// ── Libreta de calificaciones del módulo (docente) ───────────────────────────

export interface GradebookActivity {
  id: string;
  title: string;
  maxScore: number;
  weight: number;
  isPublished: boolean;
  /** Presencial: el docente edita el puntaje directo en la libreta. */
  isOffline: boolean;
  /** Examen de recuperación: no pondera — nota mayor con tope de aprobación. */
  recoveryStage: "RECUPERATORIO" | "SEGUNDA_INSTANCIA" | null;
}

export interface GradebookCell {
  activityId: string;
  score: number | null;
  status: SubmissionStatus | null;
}

export interface GradebookRow {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  grades: GradebookCell[];
  moduleGrade: { finalScore: number | null; status: ModuleGradeStatus } | null;
  observation: string;
}

export interface ModuleGradebook {
  module: { id: string; name: string; order: number };
  course: { id: string; name: string; passingScore: number };
  activities: GradebookActivity[];
  students: GradebookRow[];
}

/**
 * Libreta de calificaciones de un módulo (estudiantes × actividades + nota de
 * módulo + observación). `null` si no existe o el docente no lo dicta.
 */
export async function getModuleGradebook(
  moduleId: string,
): Promise<ModuleGradebook | null> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return null;

  const res = await fetch(
    `${API_URL}/me/modules/${encodeURIComponent(moduleId)}/gradebook`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  return (await res.json()) as ModuleGradebook;
}
