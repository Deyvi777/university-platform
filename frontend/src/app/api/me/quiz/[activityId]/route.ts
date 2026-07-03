import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

// Estado del cuestionario para el estudiante (rendir / resultado).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ activityId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  const { activityId } = await params;
  const res = await fetch(
    `${API_URL}/me/quiz/${encodeURIComponent(activityId)}`,
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    },
  );
  return NextResponse.json(await res.json().catch(() => ({})), {
    status: res.status,
  });
}
