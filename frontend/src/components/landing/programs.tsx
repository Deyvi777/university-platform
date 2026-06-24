import { Suspense } from "react";
import { getPrograms, type ProgramSummary } from "@/lib/api/programs";
import { ProgramsGrid } from "./programs-grid";

export async function Programs() {
  let programs: ProgramSummary[] = [];
  try {
    programs = await getPrograms();
  } catch {
    // Si el backend no responde, la landing se renderiza sin cards.
  }

  return (
    <section
      id="programas"
      className="scroll-mt-20 bg-slate-950 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium tracking-wide text-amber-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Oferta académica
          </p>

          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Programas diseñados para{" "}
            <span className="text-white">tu siguiente paso</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-200">
            Maestrías y diplomados con docentes expertos, modalidades flexibles
            y planes de estudio orientados a la práctica profesional.
          </p>
        </div>

        {programs.length > 0 ? (
          <Suspense>
            <ProgramsGrid programs={programs} />
          </Suspense>
        ) : (
          <p className="mt-12 rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-slate-300">
            Muy pronto publicaremos nuestra próxima oferta académica.
          </p>
        )}
      </div>
    </section>
  );
}
