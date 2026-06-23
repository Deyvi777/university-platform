"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

/**
 * Marca todas las notificaciones del usuario como leídas y revalida la bandeja
 * y el layout (badge del campanario). Server Action invocada desde la bandeja.
 */
export async function markAllReadAction() {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return;

  await fetch(`${API_URL}/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  revalidatePath("/dashboard/notificaciones");
  revalidatePath("/dashboard", "layout");
}
