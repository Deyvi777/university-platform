"use server";

import { revalidatePath } from "next/cache";
import {
  AdminApiError,
  mutateAdmin,
  type AdminGalleryItem,
  type GalleryMediaType,
} from "@/lib/api/admin";
import { handleAdminActionError } from "@/lib/auth-guard";
import type { ActionResult } from "@/app/dashboard/admin-types";

export interface GalleryItemPayload {
  type: GalleryMediaType;
  url: string;
  title?: string | null;
  isPublished?: boolean;
}

function revalidateGallery() {
  revalidatePath("/galeria");
  revalidatePath("/dashboard/galeria");
}

export async function createGalleryItemAction(
  payload: GalleryItemPayload,
): Promise<ActionResult<{ id: string }>> {
  try {
    const item = await mutateAdmin<AdminGalleryItem>(
      "POST",
      "/admin/gallery",
      payload,
    );
    revalidateGallery();
    return { ok: true, data: { id: item.id } };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updateGalleryItemAction(
  id: string,
  payload: Partial<GalleryItemPayload>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const item = await mutateAdmin<AdminGalleryItem>(
      "PATCH",
      `/admin/gallery/${id}`,
      payload,
    );
    revalidateGallery();
    return { ok: true, data: { id: item.id } };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function reorderGalleryAction(
  orderedIds: string[],
): Promise<ActionResult> {
  try {
    await mutateAdmin("PUT", "/admin/gallery/reorder", { orderedIds });
    revalidateGallery();
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteGalleryItemAction(
  id: string,
): Promise<ActionResult> {
  try {
    await mutateAdmin("DELETE", `/admin/gallery/${id}`);
    revalidateGallery();
    return { ok: true, data: undefined };
  } catch (error) {
    handleAdminActionError(error); // 401 → redirige a /login; rethrow control flow
    return { ok: false, error: errorMessage(error) };
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof AdminApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Error inesperado";
}
