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
  displayOrder: number;
  isPublished: boolean;
}

/** El backend solo acepta PROFESSOR o STUDENT al crear/editar usuarios. */
export type ManagedUserRole = "PROFESSOR" | "STUDENT";

export interface UserPayload {
  firstName: string;
  lastName: string;
  email: string;
  /** Opcional en edición: si se omite, el backend mantiene la contraseña. */
  password?: string;
  role: ManagedUserRole;
  isActive: boolean;
}

export interface CategoryPayload {
  name: string;
  slug?: string;
  displayOrder: number;
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
