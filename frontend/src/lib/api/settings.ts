const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export interface SiteSocialLinks {
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  tiktok: string | null;
  whatsapp: string | null;
}

const EMPTY: SiteSocialLinks = {
  facebook: null,
  instagram: null,
  linkedin: null,
  youtube: null,
  tiktok: null,
  whatsapp: null,
};

export async function getSiteSettings(): Promise<SiteSocialLinks> {
  try {
    const res = await fetch(`${API_URL}/settings`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return EMPTY;
    return (await res.json()) as SiteSocialLinks;
  } catch {
    // Si el backend no responde, el footer se renderiza sin redes.
    return EMPTY;
  }
}
