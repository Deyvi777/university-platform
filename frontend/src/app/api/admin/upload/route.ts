import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

const FOLDERS = ["programs", "partners"] as const;
type Folder = (typeof FOLDERS)[number];

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
  const folder = form.get("folder");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "Archivo requerido" },
      { status: 400 },
    );
  }
  if (typeof folder !== "string" || !FOLDERS.includes(folder as Folder)) {
    return NextResponse.json(
      { message: "Carpeta inválida" },
      { status: 400 },
    );
  }

  // Reenvía el archivo al backend con el token del usuario.
  const backendForm = new FormData();
  backendForm.append("file", file, file.name);

  const res = await fetch(`${API_URL}/uploads?folder=${folder}`, {
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
      : (data.message ?? "Error al subir el archivo");
    return NextResponse.json({ message }, { status: res.status });
  }

  return NextResponse.json({ url: data.url });
}
