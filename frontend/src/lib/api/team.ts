const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
}

export async function getTeam(): Promise<TeamMember[]> {
  try {
    const res = await fetch(`${API_URL}/team`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return (await res.json()) as TeamMember[];
  } catch {
    // Si el backend no responde, la sección de equipo se renderiza vacía.
    return [];
  }
}
