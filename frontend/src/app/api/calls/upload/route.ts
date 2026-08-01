import { NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export async function POST(request: Request) {
  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Archivo requerido" }, { status: 400 });
  }

  const form = new FormData();
  form.append("file", file, file.name);
  const response = await fetch(`${API_URL}/calls/applications/upload/file`, {
    method: "POST",
    body: form,
  });
  const body = (await response.json().catch(() => ({}))) as {
    url?: string;
    message?: string | string[];
  };
  if (!response.ok || !body.url) {
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : (body.message ?? "No se pudo subir el archivo");
    return NextResponse.json({ message }, { status: response.status });
  }
  return NextResponse.json({ url: body.url });
}
