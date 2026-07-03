import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

// Docente: puntúa los ensayos de un intento → recalcula y cierra la nota.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  const { attemptId } = await params;
  const body = await request.json().catch(() => ({}));
  const res = await fetch(
    `${API_URL}/me/quiz/attempts/${encodeURIComponent(attemptId)}/grade-essays`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
  return NextResponse.json(await res.json().catch(() => ({})), {
    status: res.status,
  });
}
