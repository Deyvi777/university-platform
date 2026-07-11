import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { ProgramCategory } from "@/lib/api/programs";
import type { KardexCourse } from "@/lib/api/me";

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  _count?: { programs: number };
}

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

// ---- Tipos ----

export interface AdminProgramListItem {
  id: string;
  slug: string;
  title: string;
  category: ProgramCategory;
  flyerUrl: string;
  startDate: string | null;
  isPublished: boolean;
  updatedAt: string;
}

export type { ProgramCategory };

export interface AdminProgramModule {
  id: string;
  order: number;
  name: string;
  contents: string[];
}

export interface AdminProgramTeacher {
  id: string;
  fullName: string;
  credentials: string | null;
  bio: string | null;
  photoUrl: string | null;
  order: number;
}

export interface AdminProgramExtraFeature {
  label: string;
  value: string;
}

export interface AdminProgramBankAccount {
  bank: string;
  accountNumber: string;
  holder: string;
}

export interface AdminProgram {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  category: ProgramCategory;
  flyerUrl: string;
  objective: string | null;
  specificObjectives: string[];
  targetAudience: string | null;
  modality: string | null;
  startDate: string | null;
  duration: string | null;
  hourlyLoad: string | null;
  schedule: string | null;
  videoUrl: string | null;
  extraFeatures: AdminProgramExtraFeature[];
  requirements: string[];
  enrollmentFee: string | null;
  totalCost: string | null;
  currency: string;
  installmentCount: number | null;
  installmentAmount: string | null;
  installmentCurrency: string;
  paymentFacilities: string | null;
  bankAccounts: AdminProgramBankAccount[];
  qrImageUrl: string | null;
  isPublished: boolean;
  modules: AdminProgramModule[];
  teachers: AdminProgramTeacher[];
}

export interface AdminPartner {
  id: string;
  name: string;
  logoUrl: string;
  displayOrder: number;
  isPublished: boolean;
}

export interface AdminTeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  displayOrder: number;
  isPublished: boolean;
}

export type AdminUserRole = "ADMIN" | "PROFESSOR" | "STUDENT";

export type Gender = "MALE" | "FEMALE";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  idDocument: string | null;
  /** "Expedido en": lugar de emisión del documento (opcional). */
  issuedIn: string | null;
  /** Género (obligatorio). */
  gender: Gender;
  /** Universidad de origen (opcional). */
  originUniversity: string | null;
  /** Profesión (opcional). */
  profession: string | null;
  role: AdminUserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSettings {
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  tiktok: string | null;
  whatsapp: string | null;
  /** Buzón que recibe el aviso por correo de cada solicitud de inscripción. */
  enrollmentNotifyEmail: string;
}

// ---- Programas académicos (capa Course/LMS) ----

export type CourseStatus = "DRAFT" | "ACTIVE" | "FINISHED" | "ARCHIVED";

/** Datos públicos de un docente/estudiante mostrados en el panel. */
export interface AdminCourseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface AdminModuleTeacher {
  id: string;
  teacher: AdminCourseUser;
}

export interface AdminCourseModule {
  id: string;
  order: number;
  name: string;
  description: string | null;
  credits: number | null;
  status: string;
  teachers: AdminModuleTeacher[];
}

export interface AdminEnrollment {
  id: string;
  status: string;
  enrolledAt: string;
  student: AdminCourseUser;
}

export interface AdminCourse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  modality: string | null;
  startDate: string | null;
  endDate: string | null;
  passingScore: string;
  status: CourseStatus;
  modules: AdminCourseModule[];
  enrollments: AdminEnrollment[];
}

export interface AdminCourseListItem {
  id: string;
  code: string;
  name: string;
  status: CourseStatus;
  startDate: string | null;
  updatedAt: string;
  _count: { modules: number; enrollments: number };
}

// ---- Cliente con token ----

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) {
    // Sin token en sesión: tratamos como sesión inválida y la cerramos
    // (mismo criterio que un 401 del backend en `parse`).
    redirect("/api/auth/session-expired");
  }
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    // Sesión muerta: el token de NextAuth sigue presente pero el backend lo
    // rechaza (JWT vencido/desfasado respecto a la DB: usuario inactivo, DB
    // reseedeada, token caducado). Redirigir directo a /login PROVOCABA UN
    // BUCLE: la sesión de NextAuth seguía "válida", así que login/page.tsx
    // rebotaba de vuelta a /dashboard → 401 → /login → … (ERR_TOO_MANY_REDIRECTS).
    //
    // En su lugar redirigimos al Route Handler /api/auth/session-expired, que SÍ
    // puede borrar cookies (un server component no puede en Next 16): cierra la
    // sesión vía `signOut` y luego lleva a /login?expired=1. Sin sesión, el login
    // ya no rebota: muestra el formulario con el aviso de expiración.
    // `redirect` lanza un NEXT_REDIRECT que Next maneja tanto en server
    // components como en server actions (rethrow vía handleAdminActionError).
    if (res.status === 401) {
      redirect("/api/auth/session-expired");
    }

    let message = `Error ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join(", ");
      else if (body.message) message = body.message;
    } catch {
      // respuesta sin cuerpo JSON
    }
    throw new AdminApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

// ---- Lecturas (server components) ----

export async function listAdminPrograms(): Promise<AdminProgramListItem[]> {
  return parse(await adminFetch("/admin/programs"));
}

export async function getAdminProgram(id: string): Promise<AdminProgram> {
  return parse(await adminFetch(`/admin/programs/${id}`));
}

export async function listAdminPartners(): Promise<AdminPartner[]> {
  return parse(await adminFetch("/admin/partners"));
}

export async function getAdminPartner(id: string): Promise<AdminPartner> {
  return parse(await adminFetch(`/admin/partners/${id}`));
}

export async function listAdminTeam(): Promise<AdminTeamMember[]> {
  return parse(await adminFetch("/admin/team"));
}

export async function getAdminTeamMember(id: string): Promise<AdminTeamMember> {
  return parse(await adminFetch(`/admin/team/${id}`));
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  return parse(await adminFetch("/admin/categories"));
}

export async function getAdminSettings(): Promise<AdminSettings> {
  return parse(await adminFetch("/admin/settings"));
}

export async function listAdminUsers(
  role?: AdminUserRole,
): Promise<AdminUser[]> {
  const query = role ? `?role=${role}` : "";
  return parse(await adminFetch(`/admin/users${query}`));
}

export async function getAdminUser(id: string): Promise<AdminUser> {
  return parse(await adminFetch(`/admin/users/${id}`));
}

// ---- Solicitudes de inscripción (formulario público de la landing) ----

export type EnrollmentRequestStatus = "PENDING" | "ENROLLED";

export interface AdminEnrollmentRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idDocument: string;
  issuedIn: string;
  gender: Gender;
  originUniversity: string;
  profession: string;
  programTitle: string;
  programSlug: string | null;
  status: EnrollmentRequestStatus;
  enrolledUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listAdminEnrollmentRequests(): Promise<
  AdminEnrollmentRequest[]
> {
  return parse(await adminFetch("/admin/enrollment-requests"));
}

// ---- Notas de un estudiante (vista del ADMIN) ----

export type ModuleGradeStatus = "IN_PROGRESS" | "PASSED" | "FAILED";
export type ModuleStatus = "DRAFT" | "ACTIVE" | "FINISHED";
export type SubmissionStatus =
  | "PENDING"
  | "SUBMITTED"
  | "LATE"
  | "GRADED";

/** Una actividad de un módulo con la nota del estudiante. */
export interface StudentGradeActivity {
  id: string;
  title: string;
  maxScore: number | null;
  weight: number | null;
  /** Actividad presencial calificada a mano (sin entrega del estudiante). */
  isOffline: boolean;
  /** Puntaje obtenido; `null` si aún no se calificó/entregó. */
  score: number | null;
  submissionStatus: SubmissionStatus | null;
}

export interface StudentGradeModule {
  id: string;
  order: number;
  name: string;
  credits: number | null;
  status: ModuleStatus;
  activities: StudentGradeActivity[];
  grade: {
    finalScore: number | null;
    status: ModuleGradeStatus;
    observations: string | null;
  } | null;
}

/** Un programa inscrito con el detalle de notas por módulo/actividad. */
export interface StudentGradeCourse {
  id: string;
  code: string;
  name: string;
  status: CourseStatus;
  passingScore: number;
  modules: StudentGradeModule[];
}

/** Detalle de notas (por actividad) de un estudiante — vista del ADMIN. */
export async function getStudentGrades(
  studentId: string,
): Promise<StudentGradeCourse[]> {
  return parse(await adminFetch(`/admin/students/${studentId}/grades`));
}

/** Kárdex de un estudiante (igual al que ve el propio estudiante). */
export async function getStudentKardex(
  studentId: string,
): Promise<KardexCourse[]> {
  return parse(await adminFetch(`/admin/students/${studentId}/kardex`));
}

export type AnnouncementAudience =
  | "ALL"
  | "PROFESSORS"
  | "STUDENTS"
  | "SELECTED";

export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  recipientCount: number;
  createdAt: string;
  sender: { firstName: string; lastName: string };
}

export interface AdminAnnouncementPage {
  items: AdminAnnouncement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Historial de avisos enviados, paginado y filtrable por audiencia/texto. */
export async function listAdminAnnouncements(params?: {
  page?: number;
  audience?: AnnouncementAudience;
  q?: string;
}): Promise<AdminAnnouncementPage> {
  const query = new URLSearchParams();
  if (params?.page && params.page > 1) query.set("page", String(params.page));
  if (params?.audience) query.set("audience", params.audience);
  if (params?.q?.trim()) query.set("q", params.q.trim());
  const qs = query.toString();
  return parse(await adminFetch(`/admin/notifications${qs ? `?${qs}` : ""}`));
}

export async function getAdminCategory(id: string): Promise<AdminCategory> {
  return parse(await adminFetch(`/admin/categories/${id}`));
}

export async function listAdminCourses(): Promise<AdminCourseListItem[]> {
  return parse(await adminFetch("/admin/courses"));
}

export async function getAdminCourse(id: string): Promise<AdminCourse> {
  return parse(await adminFetch(`/admin/courses/${id}`));
}

// ---- Escrituras (server actions) ----

export async function mutateAdmin<T>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  return parse<T>(
    await adminFetch(path, {
      method,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  );
}
