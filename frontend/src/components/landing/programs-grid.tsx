"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, ViewTransition } from "react";
import { useSearchParams } from "next/navigation";
import { formatStartDate, type ProgramSummary } from "@/lib/api/programs";

export function ProgramsGrid({ programs }: { programs: ProgramSummary[] }) {
  const searchParams = useSearchParams();
  const categoria = searchParams.get("categoria");

  // Pestañas derivadas de las categorías presentes en los programas.
  const categories = useMemo(() => {
    const bySlug = new Map<string, string>();
    for (const p of programs) {
      if (!bySlug.has(p.category.slug)) {
        bySlug.set(p.category.slug, p.category.name);
      }
    }
    return [...bySlug.entries()].map(([slug, name]) => ({ slug, name }));
  }, [programs]);

  const isValidTab = (slug: string | null): slug is string =>
    !!slug && categories.some((c) => c.slug === slug);

  // La URL (?categoria=<slug>, desde el navbar) inicializa la pestaña, pero el
  // usuario puede cambiarla con los botones. Sincronizamos en render cuando el
  // parámetro cambia, sin efectos (patrón recomendado por React).
  const [activeTab, setActiveTab] = useState<string>(
    isValidTab(categoria) ? categoria : "TODOS",
  );
  const [prevCategoria, setPrevCategoria] = useState(categoria);
  if (categoria !== prevCategoria) {
    setPrevCategoria(categoria);
    if (isValidTab(categoria)) {
      setActiveTab(categoria);
    }
  }

  const tabs = [{ slug: "TODOS", name: "Todos" }, ...categories];

  const visible =
    activeTab === "TODOS"
      ? programs
      : programs.filter((p) => p.category.slug === activeTab);

  return (
    <>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.slug}
            type="button"
            onClick={() => setActiveTab(tab.slug)}
            className={`rounded-full px-5 py-2 text-sm transition-colors ${
              activeTab === tab.slug
                ? "bg-amber-400 font-semibold text-slate-950"
                : "border border-white/25 font-medium text-white hover:border-white/60 hover:bg-white/10"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((program) => (
          <Link
            key={program.id}
            href={`/programas/${program.slug}`}
            onClick={() => {
              // Guardamos la URL y la posición de scroll del landing para que el
              // botón "Volver a programas" regrese exactamente aquí (con el morph
              // de View Transitions llevando imagen y título de vuelta a la card).
              try {
                sessionStorage.setItem(
                  "landingReturn",
                  JSON.stringify({
                    href: window.location.pathname + window.location.search,
                    scrollY: window.scrollY,
                  }),
                );
              } catch {
                // sessionStorage no disponible (modo privado): se ignora.
              }
            }}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10"
          >
            <ViewTransition name={`program-image-${program.slug}`}>
              <Image
                src={program.flyerUrl}
                alt={program.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </ViewTransition>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

            <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-slate-950/60 px-3 py-1 text-xs font-medium tracking-wide text-amber-300 backdrop-blur-sm">
              {program.category.name}
            </span>

            <div className="absolute inset-x-0 bottom-0 p-6">
              <ViewTransition name={`program-title-${program.slug}`}>
                <h3 className="text-xl font-bold leading-snug tracking-tight text-white">
                  {program.title}
                </h3>
              </ViewTransition>
              <p className="mt-2 text-sm text-slate-300">
                Inicio: {formatStartDate(program.startDate)} ·{" "}
                {program.modality}
              </p>
              <p className="mt-4 text-sm font-semibold text-amber-400 transition-colors group-hover:text-amber-300">
                Ver más →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
