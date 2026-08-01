import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const session = await auth();
  if (!session?.accessToken || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }
  const { filename } = await params;
  const response = await fetch(
    `${API_URL}/admin/calls/files/${encodeURIComponent(filename)}`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } },
  );
  if (!response.ok || !response.body) {
    return NextResponse.json(
      { message: "Archivo no encontrado" },
      { status: response.status },
    );
  }
  return new Response(response.body, {
    headers: {
      "Content-Type":
        response.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
