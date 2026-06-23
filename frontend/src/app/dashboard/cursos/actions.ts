"use server";

import { revalidatePath } from "next/cache";
import { AdminApiError, mutateAdmin, type AdminCourse } from "@/lib/api/admin";
import { handleAdminActionError } from "@/lib/auth-guard";
import type { ActionResult, CoursePayload } from "@/app/dashboard/admin-types";

function revalidateCourses(id?: string) {
  // La home admin muestra el conteo de programas académicos, así que también
  // se revalida.
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cursos");
  if (id) revalidatePath(`/dashboard/cursos/${id}`);
}

export async function createCourseAction(
  payload: CoursePayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const course = await mutateAdmin<AdminCourse>(
      "POST",
      "/admin/courses",
      payload,
    );
    revalidateCourses(course.id);
    return { ok: true, data: { id: course.id } };
  } catch (error) {
    handleAdminActionError(error);
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updateCourseAction(
  id: string,
  payload: CoursePayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const course = await mutateAdmin<AdminCourse>(
      "PATCH",
      `/admin/courses/${id}`,
      payload,
    );
    revalidateCourses(id);
    return { ok: true, data: { id: course.id } };
  } catch (error) {
    handleAdminActionError(error);
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteCourseAction(id: string): Promise<ActionResult> {
  try {
    await mutateAdmin("DELETE", `/admin/courses/${id}`);
    revalidateCourses();
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error);
    return { ok: false, error: errorMessage(error) };
  }
}

/** Reemplaza la lista de docentes a cargo de un módulo (co-docencia). */
export async function setModuleTeachersAction(
  courseId: string,
  moduleId: string,
  teacherIds: string[],
): Promise<ActionResult> {
  try {
    await mutateAdmin(
      "PUT",
      `/admin/courses/${courseId}/modules/${moduleId}/teachers`,
      { teacherIds },
    );
    revalidateCourses(courseId);
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error);
    return { ok: false, error: errorMessage(error) };
  }
}

/** Cambia el estado de un módulo: Borrador / Activo / Concluido. */
export async function setModuleStatusAction(
  courseId: string,
  moduleId: string,
  status: "DRAFT" | "ACTIVE" | "FINISHED",
): Promise<ActionResult> {
  try {
    await mutateAdmin(
      "PATCH",
      `/admin/courses/${courseId}/modules/${moduleId}/status`,
      { status },
    );
    revalidateCourses(courseId);
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error);
    return { ok: false, error: errorMessage(error) };
  }
}

/** Inscribe estudiantes al programa (acceso a todos los módulos). */
export async function addEnrollmentsAction(
  courseId: string,
  studentIds: string[],
): Promise<ActionResult> {
  try {
    await mutateAdmin("POST", `/admin/courses/${courseId}/enrollments`, {
      studentIds,
    });
    revalidateCourses(courseId);
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error);
    return { ok: false, error: errorMessage(error) };
  }
}

export async function removeEnrollmentAction(
  courseId: string,
  studentId: string,
): Promise<ActionResult> {
  try {
    await mutateAdmin(
      "DELETE",
      `/admin/courses/${courseId}/enrollments/${studentId}`,
    );
    revalidateCourses(courseId);
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error);
    return { ok: false, error: errorMessage(error) };
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof AdminApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Error inesperado";
}
