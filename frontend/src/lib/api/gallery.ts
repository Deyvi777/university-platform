const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export type GalleryMediaType = "IMAGE" | "VIDEO";

export interface GalleryItem {
  id: string;
  type: GalleryMediaType;
  url: string;
  title: string | null;
}

export async function getGallery(): Promise<GalleryItem[]> {
  try {
    const res = await fetch(`${API_URL}/gallery`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return (await res.json()) as GalleryItem[];
  } catch {
    // Si el backend no responde, la galería se renderiza vacía.
    return [];
  }
}
