import type { Metadata } from "next";
import { Camera } from "lucide-react";
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
      <main className="relative min-h-svh overflow-hidden bg-slate-950 pb-24 pt-32 sm:pt-36">
        <div
          className="pointer-events-none absolute -right-48 top-0 size-[34rem] rounded-full bg-amber-400/[0.07] blur-[140px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-48 top-[38rem] size-[30rem] rounded-full bg-blue-500/[0.06] blur-[140px]"
          aria-hidden="true"
        />
        <section
          id="galeria"
          className="relative mx-auto max-w-7xl px-6 lg:px-8"
          aria-labelledby="galeria-titulo"
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-6 inline-flex items-center gap-2 border-b-2 border-amber-400 pb-1 text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
              <Camera className="h-5 w-5" aria-hidden="true" />
              Nuestra comunidad
            </p>
            <h1
              id="galeria-titulo"
              className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl"
            >
              Galería de momentos
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-200">
              Fotos y videos de nuestras actividades académicas, graduaciones y vida institucional.
            </p>
          </div>

          <div className="mt-16 sm:mt-20">
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
