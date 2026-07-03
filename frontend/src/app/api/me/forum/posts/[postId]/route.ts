import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

// Edita un mensaje propio del foro.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  const { postId } = await params;
  const body = await request.json().catch(() => ({}));

  const res = await fetch(
    `${API_URL}/me/forum/posts/${encodeURIComponent(postId)}`,
    {
      method: "PATCH",
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

// Borra un mensaje (autor) o modera (docente/ADMIN).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  const { postId } = await params;

  const res = await fetch(
    `${API_URL}/me/forum/posts/${encodeURIComponent(postId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    },
  );
  return NextResponse.json(await res.json().catch(() => ({})), {
    status: res.status,
  });
}
