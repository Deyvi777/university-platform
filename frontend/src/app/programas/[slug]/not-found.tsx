import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";

export default function ProgramNotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-svh flex-col items-center justify-center bg-slate-950 px-6 text-center">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium tracking-wide text-amber-300 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Error 404
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Programa no encontrado
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">
          El programa que buscas no existe o ya no está disponible. Explora
          nuestra oferta académica vigente.
        </p>
        <Link
          href="/#programas"
          className="mt-10 rounded-full bg-amber-400 px-8 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 hover:shadow-amber-300/30"
        >
          Ver programas
        </Link>
      </main>
    </>
  );
}
