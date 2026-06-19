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
  const res = await fetch(`${API_URL}/partners`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Error al obtener instituciones aliadas: ${res.status}`);
  }
  return res.json();
}
