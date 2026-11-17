import type { MetadataRoute } from "next";
import { getCalls } from "@/lib/api/calls";
import { getPrograms } from "@/lib/api/programs";
import { absoluteUrl } from "@/lib/seo";

// El backend interno no está disponible durante el build de Docker.
// Si falla en runtime, devolvemos un error en vez de un mapa incompleto con 200.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [programs, calls] = await Promise.all([getPrograms(), getCalls()]);
  const paths = [
    "/",
    "/nosotros",
    "/contacto",
    "/galeria",
    "/convocatorias",
    "/privacidad",
    ...programs.map((program) => `/programas/${program.slug}`),
    ...calls.map((call) => `/convocatorias/${call.slug}`),
  ];

  // Las APIs públicas no exponen updatedAt; no inventar fechas de modificación.
  return paths.map((path) => ({ url: absoluteUrl(path) }));
}
