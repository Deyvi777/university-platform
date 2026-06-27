import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

// Kárdex de un estudiante para el modal del ADMIN. Reenvía al backend con el
// token del admin.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;

  const res = await fetch(
    `${API_URL}/admin/students/${encodeURIComponent(id)}/kardex`,
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    },
  );
  return NextResponse.json(await res.json().catch(() => ({})), {
    status: res.status,
  });
}
