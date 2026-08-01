import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarClock, ClipboardList } from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import {
  callStatus,
  formatCallDate,
  getCalls,
  type CallSummary,
} from "@/lib/api/calls";

export const metadata: Metadata = {
  title: "Convocatorias | Certificate Bolivia",
  description:
    "Conoce y postula a las convocatorias académicas y profesionales de Certificate Bolivia.",
};

export default async function ConvocatoriasPage() {
  let calls: CallSummary[] = [];
  try {
    calls = await getCalls();
  } catch {
    // La página conserva su estructura aunque el backend no esté disponible.
  }

  return (
    <>
      <Navbar />
      <main className="bg-slate-950">
        <section
          id="convocatorias-vigentes"
          className="min-h-svh scroll-mt-20 pt-20 pb-8 sm:pt-24 sm:pb-12"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-amber-300">
                <ClipboardList className="size-4" aria-hidden="true" />
                Convocatorias vigentes
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Encuentra una oportunidad para ti
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                Selecciona una ficha para conocer todos los detalles y completar
                el formulario de postulación.
              </p>
            </div>

            {calls.length ? (
              <div className="mt-16 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                {calls.map((call) => (
                  <CallCard key={call.id} call={call} />
                ))}
              </div>
            ) : (
              <div className="mx-auto mt-16 max-w-2xl rounded-3xl border border-white/10 bg-white/5 px-8 py-14 text-center">
                <ClipboardList className="mx-auto size-10 text-amber-400" />
                <h3 className="mt-5 text-xl font-semibold text-white">
                  No hay convocatorias publicadas
                </h3>
                <p className="mt-2 text-slate-300">
                  Muy pronto encontrarás nuevas oportunidades en esta sección.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function CallCard({ call }: { call: CallSummary }) {
  const status = callStatus(call);
  return (
    <Link
      href={`/convocatorias/${call.slug}`}
      className="group flex min-h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition duration-300 hover:-translate-y-1 hover:border-amber-400/35 hover:bg-white/[0.06]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">
        <Image
          src={call.coverUrl ?? "/landing/convocatorias-hero.webp"}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
        <span
          className={`absolute left-5 top-5 rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
            status === "ABIERTA"
              ? "bg-emerald-400 text-slate-950"
              : status === "PRÓXIMA"
                ? "bg-amber-400 text-slate-950"
                : "bg-white/15 text-white backdrop-blur-md"
          }`}
        >
          {status}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold leading-snug text-white group-hover:text-amber-300">
          {call.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
          {call.summary}
        </p>
        {call.closesAt && (
          <div className="mt-6 border-t border-white/10 pt-5 text-sm text-slate-300">
            <p className="flex items-start gap-2">
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-amber-400" />
              Cierre: {formatCallDate(call.closesAt)}
            </p>
          </div>
        )}
        <span className="mt-6 inline-flex items-center gap-2 font-semibold text-amber-300">
          Ver y postular{" "}
          <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
