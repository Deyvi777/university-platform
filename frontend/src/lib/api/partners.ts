const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
}

export async function getPartners(): Promise<Partner[]> {
  try {
    const res = await fetch(`${API_URL}/partners`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return (await res.json()) as Partner[];
  } catch {
    // Si el backend no responde, las secciones de instituciones se renderizan vacías.
    return [];
  }
}
