import type { Metadata } from "next";
import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/landing/navbar";
import { BackToPrograms } from "./back-to-programs";
import {
  formatAmount,
  formatStartDate,
  getProgramBySlug,
} from "@/lib/api/programs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) return { title: "Programa no encontrado — Certificate" };
  return {
    title: `${program.title} — Certificate`,
    description: program.objective,
  };
}

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
}

export default async function ProgramPage({ params }: Props) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const quickFacts = [
    { label: "Modalidad", value: program.modality },
    { label: "Inicio de clases", value: formatStartDate(program.startDate) },
    { label: "Duración", value: program.duration },
    { label: "Horarios", value: program.schedule },
  ];

  return (
    <>
      <Navbar />
      <main className="bg-slate-950 pb-24 pt-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <BackToPrograms />

          {/* Encabezado */}
          <div className="mt-8 grid items-start gap-12 lg:grid-cols-[1fr_420px]">
            <div>
              <p className="mb-6 flex w-fit mx-auto rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium tracking-wide text-amber-300 backdrop-blur-sm">
                {program.category.name}
              </p>

              <ViewTransition name={`program-title-${program.slug}`}>
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                  {program.title}
                </h1>
              </ViewTransition>

              <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-amber-400">
                Objetivo del programa
              </h2>
              <p className="mt-3 text-lg leading-8 text-slate-200">
                {program.objective}
              </p>

              <h2 className="mt-8 text-sm font-semibold uppercase tracking-widest text-amber-400">
                Dirigido a
              </h2>
              <p className="mt-3 text-lg leading-8 text-slate-200">
                {program.targetAudience}
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/contacto"
                  className="rounded-full bg-amber-400 px-8 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 hover:shadow-amber-300/30"
                >
                  Inscríbete ahora
                </Link>
                <Link
                  href="/contacto"
                  className="rounded-full border border-white/30 px-8 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/10"
                >
                  Solicitar información
                </Link>
              </div>
            </div>

            <ViewTransition name={`program-image-${program.slug}`}>
              <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-white/10 lg:mx-0">
                <Image
                  src={program.flyerUrl}
                  alt={`Flyer de ${program.title}`}
                  width={840}
                  height={1050}
                  priority
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="h-auto w-full"
                />
              </div>
            </ViewTransition>
          </div>

          {/* Ficha rápida */}
          <dl className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {quickFacts.map((fact) => (
              <div
                key={fact.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <dt className="text-sm text-slate-300">{fact.label}</dt>
                <dd className="mt-2 font-semibold leading-snug text-white">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* Malla académica */}
          <section className="mt-20">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Malla <span className="text-amber-400">académica</span>
            </h2>
            <div className="mt-8 space-y-4">
              {program.modules.map((module) => (
                <div
                  key={module.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="text-sm font-bold uppercase tracking-widest text-amber-400">
                      Módulo {module.order}
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {module.name}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {module.contents.map((content) => (
                      <li
                        key={content}
                        className="flex items-start gap-3 text-slate-200"
                      >
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                        {content}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Plantel docente */}
          <section className="mt-20">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Plantel <span className="text-amber-400">docente</span>
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {program.teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6"
                >
                  {teacher.photoUrl ? (
                    <Image
                      src={teacher.photoUrl}
                      alt={teacher.fullName}
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-amber-300">
                      {getInitials(teacher.fullName)}
                    </span>
                  )}
                  <div>
                    <p className="font-semibold text-white">
                      {teacher.fullName}
                    </p>
                    <p className="mt-1 text-sm leading-snug text-slate-300">
                      {teacher.credentials}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Requisitos + Inversión */}
          <div className="mt-20 grid gap-8 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Requisitos de <span className="text-amber-400">admisión</span>
              </h2>
              <ul className="mt-6 space-y-3">
                {program.requirements.map((requirement) => (
                  <li
                    key={requirement}
                    className="flex items-start gap-3 text-slate-200"
                  >
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {requirement}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-8">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Inversión
              </h2>
              <dl className="mt-6 space-y-5">
                <div className="flex items-baseline justify-between border-b border-white/10 pb-5">
                  <dt className="text-slate-200">Matrícula</dt>
                  <dd className="text-2xl font-bold text-white">
                    {program.currency} {formatAmount(program.enrollmentFee)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-slate-200">Inversión total</dt>
                  <dd className="text-3xl font-bold text-amber-400">
                    {program.currency} {formatAmount(program.totalCost)}
                  </dd>
                </div>
              </dl>
              {program.paymentFacilities && (
                <p className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-200">
                  {program.paymentFacilities}
                </p>
              )}
              <Link
                href="/contacto"
                className="mt-8 block rounded-full bg-amber-400 px-8 py-3.5 text-center text-base font-semibold text-slate-950 shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 hover:shadow-amber-300/30"
              >
                Quiero inscribirme
              </Link>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
