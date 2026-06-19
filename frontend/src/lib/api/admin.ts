import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { ProgramCategory } from "@/lib/api/programs";

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
  startDate: string;
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
  credentials: string;
  photoUrl: string | null;
  order: number;
}

export interface AdminProgram {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  category: ProgramCategory;
  flyerUrl: string;
  objective: string;
  targetAudience: string;
  modality: string;
  startDate: string;
  duration: string;
  schedule: string;
  requirements: string[];
  enrollmentFee: string;
  totalCost: string;
  currency: string;
  paymentFacilities: string | null;
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

export type AdminUserRole = "ADMIN" | "PROFESSOR" | "STUDENT";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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

export async function getAdminCategory(id: string): Promise<AdminCategory> {
  return parse(await adminFetch(`/admin/categories/${id}`));
}

// ---- Escrituras (server actions) ----

export async function mutateAdmin<T>(
  method: "POST" | "PATCH" | "DELETE",
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
