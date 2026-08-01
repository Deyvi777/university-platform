import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarClock, ClipboardCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { formatCallDate, getCallBySlug } from "@/lib/api/calls";
import { ApplicationForm } from "./application-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const call = await getCallBySlug(slug);
  return call
    ? { title: `${call.title} | Convocatorias`, description: call.summary }
    : { title: "Convocatoria no encontrada" };
}

export default async function ConvocatoriaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const call = await getCallBySlug(slug);
  if (!call) notFound();

  return (
    <>
      <Navbar />
      <main className="bg-slate-950">
        <section className="relative isolate overflow-hidden pb-20 pt-36 sm:pb-28">
          <Image
            src={call.coverUrl ?? "/landing/convocatorias-hero.webp"}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/55" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <Link
              href="/convocatorias"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-amber-300"
            >
              <ArrowLeft className="size-4" /> Volver a convocatorias
            </Link>
            <div className="mt-10 max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/[0.08] px-4 py-1.5 text-sm font-medium text-amber-300 backdrop-blur-sm">
                <ClipboardCheck className="size-4" /> Convocatoria
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                {call.title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-200">
                {call.summary}
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-200">
                {call.opensAt && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-sm">
                    <CalendarClock className="size-4 text-amber-400" />
                    Apertura: {formatCallDate(call.opensAt)}
                  </span>
                )}
                {call.closesAt && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-sm">
                    <CalendarClock className="size-4 text-amber-400" />
                    Cierre: {formatCallDate(call.closesAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 pb-28 pt-16">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
                Información
              </p>
              <h2 className="mt-3 text-2xl font-bold text-white">
                Antes de postular
              </h2>
              <div className="mt-5 whitespace-pre-line text-base leading-7 text-slate-300">
                {call.description ??
                  "Lee cuidadosamente cada pregunta y prepara tus documentos antes de comenzar."}
              </div>
            </aside>
            <div>
              <ApplicationForm call={call} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
