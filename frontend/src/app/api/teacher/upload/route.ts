import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

// Reenvía el archivo del docente (o del admin, que gestiona módulos como
// docente) al backend (`/me/uploads`) con su token. El backend valida rol,
// tipo y tamaño, y devuelve la ruta `/files/...`.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  // Leer el body ANTES de rechazar: responder 4xx sin consumir el multipart
  // deja la subida del navegador colgada en "Subiendo…" para siempre.
  const form = await request.formData();
  if (session.user.role !== "PROFESSOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Archivo requerido" }, { status: 400 });
  }

  const backendForm = new FormData();
  backendForm.append("file", file, file.name);

  const res = await fetch(`${API_URL}/me/uploads`, {
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
