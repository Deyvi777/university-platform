export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface ProgramModulePayload {
  order: number;
  name: string;
  contents: string[];
}

export interface ProgramTeacherPayload {
  fullName: string;
  credentials: string;
  photoUrl?: string | null;
  order: number;
}

export interface ProgramPayload {
  title: string;
  slug?: string;
  categoryId: string;
  flyerUrl: string;
  objective: string;
  targetAudience: string;
  modality: string;
  startDate: string;
  duration: string;
  schedule: string;
  requirements: string[];
  enrollmentFee: number;
  totalCost: number;
  currency: string;
  paymentFacilities?: string | null;
  isPublished: boolean;
  modules: ProgramModulePayload[];
  teachers: ProgramTeacherPayload[];
}

export interface PartnerPayload {
  name: string;
  logoUrl: string;
  /** Opcional: si se omite, el backend agrega la institución al final. */
  displayOrder?: number;
  isPublished: boolean;
}

export interface TeamMemberPayload {
  name: string;
  role: string;
  photoUrl: string;
  /** Opcional: si se omite, el backend agrega el integrante al final. */
  displayOrder?: number;
  isPublished: boolean;
}

/** El backend solo acepta PROFESSOR o STUDENT al crear/editar usuarios. */
export type ManagedUserRole = "PROFESSOR" | "STUDENT";

export interface UserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Documento de identidad (carnet): opcional; `null` lo limpia. */
  idDocument?: string | null;
  /** Opcional en edición: si se omite, el backend mantiene la contraseña. */
  password?: string;
  /**
   * Opcional: solo se envía al CREAR (PROFESSOR/STUDENT). En edición se omite
   * para que el backend (update parcial) preserve el rol actual — incluido
   * ADMIN, que el DTO no acepta como valor entrante.
   */
  role?: ManagedUserRole;
  isActive: boolean;
}

/** Error de una fila en la carga masiva (índice 0-based del arreglo enviado). */
export interface BulkRowError {
  index: number;
  email?: string;
  message: string;
}

/** Resumen que devuelve la carga masiva de estudiantes. */
export interface BulkUploadResult {
  total: number;
  created: number;
  errors: BulkRowError[];
}

export interface CategoryPayload {
  name: string;
  slug?: string;
  /** Opcional: si se omite, el backend agrega la categoría al final. */
  displayOrder?: number;
  isActive: boolean;
}

// ---- Programa académico (Course) ----

export type CourseStatusValue = "DRAFT" | "ACTIVE" | "FINISHED" | "ARCHIVED";

export interface CourseModuleInput {
  /** Presente al editar un módulo existente; ausente al crear uno nuevo. */
  id?: string;
  name: string;
  description?: string | null;
  credits?: number | null;
}

export interface CoursePayload {
  name: string;
  code?: string;
  description?: string | null;
  modality?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  passingScore: number;
  status: CourseStatusValue;
  modules: CourseModuleInput[];
}

export interface SettingsPayload {
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  tiktok: string | null;
  whatsapp: string | null;
}
