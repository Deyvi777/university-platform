import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

const VIDEO_FOLDERS = ["programs-videos", "gallery-videos"] as const;
type VideoFolder = (typeof VIDEO_FOLDERS)[number];

/**
 * Reenvía la subida de un video del admin al backend (`POST /uploads/video`,
 * solo ADMIN) con el token del usuario: el promocional de un programa
 * (carpeta por defecto) o un video de la galería (`folder=gallery-videos`).
 * El backend valida el tipo (MP4/WebM/OGG/MOV) y el tamaño (hasta 200 MB).
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
  const rawFolder = form.get("folder");
  const folder: VideoFolder =
    typeof rawFolder === "string" &&
    VIDEO_FOLDERS.includes(rawFolder as VideoFolder)
      ? (rawFolder as VideoFolder)
      : "programs-videos";

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Archivo requerido" }, { status: 400 });
  }

  const backendForm = new FormData();
  backendForm.append("file", file, file.name);

  const res = await fetch(`${API_URL}/uploads/video?folder=${folder}`, {
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
