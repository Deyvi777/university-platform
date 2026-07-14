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

/** Docente a cargo (solo nombre y apellido) para mostrar en listados. */
export interface ModuleTeacherName {
  firstName: string;
  lastName: string;
}

/** Un módulo del curso (lista para el acordeón de programas del estudiante). */
export interface ProgramModule {
  id: string;
  order: number;
  name: string;
  status: ModuleStatus;
  /** Docentes a cargo del módulo (co-docencia); puede estar vacío. */
  teachers: ModuleTeacherName[];
}

/** Curso asignado al usuario (docente/estudiante). */
export interface MyCourse {
  id: string;
  code: string;
  name: string;
  icon: string | null;
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

// ── Foro (activityType = FORUM) ──────────────────────────────────────────────
export interface ForumPost {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  author: { id: string; firstName: string; lastName: string };
  isMine: boolean;
  canDelete: boolean;
}

export interface ForumThread {
  activity: {
    id: string;
    title: string;
    instructions: string | null;
    activityFileUrl: string | null;
    activityFileName: string | null;
    /** Fecha límite de participación (informativa). */
    dueDate: string | null;
    moduleStatus: ModuleStatus;
  };
  viewer: { id: string; isTeacher: boolean };
  canPost: boolean;
  posts: ForumPost[];
}

// ── Cuestionario / Examen (activityType = QUIZ/EXAM) ─────────────────────────

/**
 * Examen de recuperación: se habilita sobre un módulo CONCLUIDO para los
 * reprobados y su nota REEMPLAZA la nota final del módulo (no pondera).
 */
export type RecoveryStage = "RECUPERATORIO" | "SEGUNDA_INSTANCIA";

export type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_TEXT"
  | "ESSAY";

export type QuizAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED";

export interface QuizRunnerQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  options: { id: string; text: string }[];
}

export interface QuizReviewAnswer {
  selectedOptionIds: string[];
  boolValue: boolean | null;
  textValue: string | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
}

export interface QuizReviewQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  boolAnswer: boolean | null;
  acceptedAnswers: string[];
  options: { id: string; text: string; isCorrect: boolean }[];
  answer: QuizReviewAnswer | null;
}

/** Respuesta autoguardada de un intento en curso (para restaurar el form). */
export interface SavedQuizAnswer {
  questionId: string;
  selectedOptionIds: string[];
  boolValue: boolean | null;
  textValue: string | null;
}

export interface QuizRunner {
  activity: {
    id: string;
    title: string;
    type: ActivityType;
    instructions: string | null;
    activityFileUrl: string | null;
    activityFileName: string | null;
    maxScore: number;
    questionCount: number;
    /**
     * Examen de recuperación: la nota final del módulo pasa a ser la mayor
     * entre la nota actual y la del examen, topeada en `passingScore`.
     */
    recoveryStage: RecoveryStage | null;
    /** Nota de aprobación del curso (tope de la nota de recuperación). */
    passingScore: number;
  };
  settings: {
    timeLimitMin: number | null;
    singleAttempt: boolean;
    shuffle: boolean;
    revealAnswers: boolean;
    availableFrom: string | null;
    availableUntil: string | null;
  };
  open: boolean;
  moduleFinished: boolean;
  attempt:
    | null
    | {
        id: string;
        status: QuizAttemptStatus;
        deadline?: string | null;
        score?: number | null;
      };
  canStart?: boolean;
  questions?: QuizRunnerQuestion[];
  /** Autoguardado del intento en curso (restaura las respuestas al recargar). */
  savedAnswers?: SavedQuizAnswer[];
  review?: QuizReviewQuestion[] | null;
}

export interface QuizEditorQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  boolAnswer: boolean | null;
  acceptedAnswers: string[];
  options: { id: string; text: string; isCorrect: boolean }[];
}

export interface QuizEditor {
  activity: { id: string; title: string; type: ActivityType; maxScore: number };
  /** Con intentos existentes el banco de preguntas queda bloqueado. */
  attemptCount: number;
  questions: QuizEditorQuestion[];
}

export interface QuizAttemptRow {
  attemptId: string;
  student: { id: string; firstName: string; lastName: string; email: string };
  status: QuizAttemptStatus;
  submittedAt: string | null;
  autoScore: number | null;
  totalScore: number | null;
}

export interface QuizAttemptsList {
  activity: { id: string; title: string; type: ActivityType; maxScore: number };
  attempts: QuizAttemptRow[];
}

export interface SubmissionFile {
  name: string;
  url: string;
  size: number | null;
}

/** Una entrega del historial de un Proyecto (cada envío es una fila nueva). */
export interface ProjectDelivery {
  /** Número de entrega (1, 2, 3…). */
  order: number;
  /** Nota opcional que el estudiante escribió en esta entrega. */
  text: string | null;
  /** Momento en que se envió esta entrega. */
  submittedAt: string | null;
  files: SubmissionFile[];
}

export interface StudentSubmission {
  content: string | null;
  fileUrl: string | null;
  /** Historial de entregas de un Proyecto (vacío en Tarea, que usa `fileUrl`). */
  deliveries: ProjectDelivery[];
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
  activityFileUrl: string | null;
  activityFileName: string | null;
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
  files: { id: string; name: string; url: string; size: number | null }[];
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
  /** Estado del módulo; las etiquetas aprobado/reprobado solo aplican si es `FINISHED`. */
  status: ModuleStatus;
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
 * Un contenido del aula (entrada del temario). Los campos específicos del tipo
 * solo aplican según `kind`. Además trae el progreso del estudiante y —para
 * actividades— su entrega/nota.
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
  activityFileUrl: string | null;
  activityFileName: string | null;
  dueDate: string | null;
  maxScore: number | null;
  weight: number | null;
  /** Actividad presencial (calificada a mano): no es lección del temario. */
  isOffline: boolean;
  /** Examen de recuperación (visible solo para el estudiante elegible). */
  recoveryStage: RecoveryStage | null;
  /** Archivos contenidos (solo kind = FOLDER). */
  folderFiles?: FolderFile[];
  /** El estudiante marcó este contenido como completado. */
  completed: boolean;
  /** Entrega del estudiante (solo actividades); `null` si no aplica/no entregó. */
  submission: StudentSubmission | null;
}

/** Módulo en modo aula para el estudiante. */
export interface LearnModule {
  id: string;
  order: number;
  name: string;
  description: string | null;
  /** Estado del módulo; si es `FINISHED` el aula queda en solo lectura. */
  status: ModuleStatus;
  course: { id: string; name: string; code: string };
  /** Docentes a cargo del módulo (co-docencia); puede estar vacío. */
  teachers: ModuleTeacherName[];
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
