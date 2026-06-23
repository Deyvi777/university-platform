import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

// Marca una notificación del usuario como leída (reenvía al backend con su token).
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  const { id } = await params;

  const res = await fetch(
    `${API_URL}/notifications/${encodeURIComponent(id)}/read`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    },
  );
  return NextResponse.json(await res.json().catch(() => ({})), {
    status: res.status,
  });
}
