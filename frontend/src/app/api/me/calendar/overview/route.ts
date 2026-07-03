import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

// Datos del calendario del panel derecho (fechas plazo + recordatorios).
// Reenvía al backend con el token del usuario.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const res = await fetch(`${API_URL}/me/calendar/overview`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  return NextResponse.json(await res.json().catch(() => ({})), {
    status: res.status,
  });
}
