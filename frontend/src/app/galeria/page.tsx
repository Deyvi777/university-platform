import type { Metadata } from "next";
import { Footer } from "@/components/landing/footer";
import { GalleryCarousel } from "@/components/landing/gallery-carousel";
import { Navbar } from "@/components/landing/navbar";
import { getGallery } from "@/lib/api/gallery";

export const metadata: Metadata = {
  title: "Galería — Certificate",
  description:
    "Fotos y videos de las actividades académicas de Certificate, Escuela Multidisciplinaria de Postgrado y Formación Continua.",
};

export default async function GaleriaPage() {
  const items = await getGallery();

  return (
    <>
      <Navbar />
      <main className="min-h-svh bg-slate-950 pb-24 pt-32">
        <section
          id="galeria"
          className="mx-auto max-w-7xl px-6 lg:px-8"
          aria-labelledby="galeria-titulo"
        >
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-amber-300 backdrop-blur-sm">
              <span
                className="size-1.5 rounded-full bg-amber-400"
                aria-hidden="true"
              />
              Nuestra comunidad
            </span>
            <h1
              id="galeria-titulo"
              className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl"
            >
              Galería de momentos
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-200">
              Fotos y videos de nuestras actividades académicas, graduaciones y
              vida institucional.
            </p>
          </div>

          <div className="mt-2">
            {items.length > 0 ? (
              <GalleryCarousel items={items} />
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-slate-300">
                Muy pronto compartiremos aquí las fotos y videos de nuestras
                actividades.
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
