import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

/**
 * Reenvía la subida del video promocional de un programa al backend
 * (`POST /uploads/video`, solo ADMIN) con el token del usuario. El backend
 * valida el tipo (MP4/WebM/OGG/MOV) y el tamaño (hasta 200 MB).
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Archivo requerido" }, { status: 400 });
  }

  const backendForm = new FormData();
  backendForm.append("file", file, file.name);

  const res = await fetch(`${API_URL}/uploads/video`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body: backendForm,
  });

  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    message?: string | string[];
  };

  if (!res.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : (data.message ?? "Error al subir el video");
    return NextResponse.json({ message }, { status: res.status });
  }

  return NextResponse.json({ url: data.url });
}
