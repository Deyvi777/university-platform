import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export type CourseStatus = "DRAFT" | "ACTIVE" | "FINISHED" | "ARCHIVED";

/** Un módulo a cargo del docente (solo para PROFESSOR). */
export interface MyCourseModule {
  id: string;
  name: string;
  order: number;
}

/** Un módulo del curso (lista para el acordeón de programas del estudiante). */
export interface ProgramModule {
  id: string;
  order: number;
  name: string;
  status: ModuleStatus;
}

/** Curso asignado al usuario (docente/estudiante). */
export interface MyCourse {
  id: string;
  code: string;
  name: string;
  modality: string | null;
  status: CourseStatus;
  startDate: string | null;
  moduleCount: number;
  /** Módulos a cargo (PROFESSOR); `null` para estudiantes. */
  myModules: MyCourseModule[] | null;
  /** Todos los módulos del curso (estudiante); ausente para docentes. */
  modules?: ProgramModule[];
}

export type ModuleStatus = "DRAFT" | "ACTIVE" | "FINISHED";
export type ModuleGradeStatus = "IN_PROGRESS" | "PASSED" | "FAILED";
export type MaterialType = "FILE" | "LINK" | "VIDEO";
export type ActivityType = "ASSIGNMENT" | "QUIZ" | "EXAM" | "PROJECT" | "FORUM";
export type SubmissionStatus = "PENDING" | "SUBMITTED" | "LATE" | "GRADED";

export interface StudentSubmission {
  content: string | null;
  fileUrl: string | null;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
}

export interface CourseActivity {
  id: string;
  type: ActivityType;
  title: string;
  instructions: string | null;
  dueDate: string | null;
  maxScore: number;
  weight: number;
  /** Entrega del estudiante (su propia entrega/nota); `null` si no ha entregado. */
  submission: StudentSubmission | null;
}

export interface CourseTeacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CourseTopic {
  id: string;
  order: number;
  title: string;
  description: string | null;
}

export interface CourseMaterial {
  id: string;
  title: string;
  type: MaterialType;
  url: string;
}

export interface CourseModuleDetail {
  id: string;
  order: number;
  name: string;
  description: string | null;
  credits: number | null;
  status: ModuleStatus;
  /** El docente dicta este módulo (siempre `false` para estudiantes). */
  mine: boolean;
  teachers: CourseTeacher[];
  /** Cantidad de contenidos del módulo (publicados, para el estudiante). */
  contentCount: number;
  /** Nota del estudiante en el módulo (`null` para docentes o sin nota aún). */
  grade: { finalScore: number | null; status: ModuleGradeStatus } | null;
}

export interface MyCourseDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  modality: string | null;
  status: CourseStatus;
  startDate: string | null;
  endDate: string | null;
  passingScore: number;
  modules: CourseModuleDetail[];
}

/**
 * Detalle de un curso asignado al usuario. Devuelve `null` si no existe o no
 * tiene acceso (→ `notFound()` en la página). El backend autoriza por rol.
 */
export async function getMyCourse(id: string): Promise<MyCourseDetail | null> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return null;

  const res = await fetch(`${API_URL}/me/courses/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as MyCourseDetail;
}

export interface KardexModule {
  id: string;
  order: number;
  name: string;
  credits: number | null;
  grade: { finalScore: number | null; status: ModuleGradeStatus } | null;
}

export interface KardexCourse {
  id: string;
  code: string;
  name: string;
  status: CourseStatus;
  passingScore: number;
  moduleCount: number;
  gradedCount: number;
  passedCount: number;
  average: number | null;
  modules: KardexModule[];
}

/**
 * Kárdex del estudiante: todas sus notas por curso. Ante cualquier error
 * devuelve `[]` para que el panel nunca se rompa.
 */
export async function getKardex(): Promise<KardexCourse[]> {
  try {
    const session = await auth();
    const token = session?.accessToken;
    if (!token) return [];

    const res = await fetch(`${API_URL}/me/kardex`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as KardexCourse[];
  } catch {
    return [];
  }
}

/**
 * Cursos asignados al usuario autenticado. Se llama desde el home del panel
 * (Server Component) con el token de la sesión. Ante cualquier error devuelve
 * `[]` para que el panel nunca se rompa por esto.
 */
export async function listMyCourses(): Promise<MyCourse[]> {
  try {
    const session = await auth();
    const token = session?.accessToken;
    if (!token) return [];

    const res = await fetch(`${API_URL}/me/courses`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as MyCourse[];
  } catch {
    return [];
  }
}

// ── Vista de aprendizaje (aula) del estudiante ───────────────────────────────

export type ContentKind = "TEXT" | "VIDEO" | "MATERIAL" | "ACTIVITY";

/**
 * Un contenido del aula (entrada del temario). Los campos específicos del tipo
 * solo aplican según `kind`. Además trae el progreso y apuntes del estudiante, y
 * —para actividades— su entrega/nota.
 */
export interface LearnContent {
  id: string;
  order: number;
  kind: ContentKind;
  title: string;
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
  /** Actividad presencial (calificada a mano): no es lección del temario. */
  isOffline: boolean;
  /** El estudiante marcó este contenido como completado. */
  completed: boolean;
  /** Apuntes personales del estudiante sobre este contenido ("" si vacío). */
  note: string;
  /** Entrega del estudiante (solo actividades); `null` si no aplica/no entregó. */
  submission: StudentSubmission | null;
}

/** Módulo en modo aula para el estudiante. */
export interface LearnModule {
  id: string;
  order: number;
  name: string;
  description: string | null;
  course: { id: string; name: string; code: string };
  /** Nota del módulo del estudiante + observación del docente; `null` si aún no hay. */
  grade: {
    finalScore: number | null;
    status: ModuleGradeStatus;
    observations: string | null;
  } | null;
  contents: LearnContent[];
}

/**
 * Módulo en modo aula (reproductor) para el estudiante inscrito. Devuelve `null`
 * si no existe o no tiene acceso (→ `notFound()` en la página). El backend
 * autoriza por inscripción.
 */
export async function getLearnModule(
  moduleId: string,
): Promise<LearnModule | null> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return null;

  const res = await fetch(
    `${API_URL}/me/modules/${encodeURIComponent(moduleId)}/learn`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  return (await res.json()) as LearnModule;
}
