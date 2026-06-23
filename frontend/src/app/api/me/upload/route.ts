import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

// Subida genérica del usuario autenticado: reenvía a `/me/uploads`. El backend
// valida rol/tipo/tamaño y elige la carpeta (materials/submissions) según el rol.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const form = await request.formData();
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
