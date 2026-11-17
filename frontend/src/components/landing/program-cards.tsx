"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { formatStartDate, type ProgramSummary } from "@/lib/api/programs";

// Sin useSearchParams: las mismas tarjetas se renderizan en el HTML inicial.
export function ProgramCards({ programs }: { programs: ProgramSummary[] }) {
  return (
    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {programs.map((program) => (
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
            {(program.startDate || program.modality) && (
              <p className="mt-2 text-sm text-slate-300">
                {[
                  program.startDate
                    ? `Inicio: ${formatStartDate(program.startDate)}`
                    : null,
                  program.modality,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <p className="mt-4 text-sm font-semibold text-amber-400 transition-colors group-hover:text-amber-300">
              Ver más →
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
