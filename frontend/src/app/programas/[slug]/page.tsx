import type { Metadata } from "next";
import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/landing/navbar";
import { ProgramVideoModal } from "@/components/landing/program-video-modal";
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
    description:
      program.objective ?? `${program.title} — ${program.category.name}`,
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

/** Viñeta de check para los objetivos específicos. */
function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-1 h-5 w-5 shrink-0 text-amber-400"
    >
      <path d="M21.801 10A10 10 0 1 1 17 3.335" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

export default async function ProgramPage({ params }: Props) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  // Solo se muestran los datos que el admin llenó; los vacíos se omiten.
  const quickFacts = [
    { label: "Modalidad", value: program.modality },
    {
      label: "Inicio de clases",
      value: program.startDate ? formatStartDate(program.startDate) : null,
    },
    { label: "Duración", value: program.duration },
    { label: "Carga horaria", value: program.hourlyLoad },
    { label: "Horarios", value: program.schedule },
    ...program.extraFeatures.map((f) => ({ label: f.label, value: f.value })),
  ].filter((fact): fact is { label: string; value: string } =>
    Boolean(fact.value),
  );

  const hasInstallments = program.installmentAmount != null;
  const hasInvestment =
    program.enrollmentFee != null ||
    program.totalCost != null ||
    hasInstallments ||
    Boolean(program.paymentFacilities);
  const hasRequirements = program.requirements.length > 0;
  const hasBankAccounts = program.bankAccounts.length > 0;
  const hasPaymentChannels = hasBankAccounts || Boolean(program.qrImageUrl);

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

              {program.objective && (
                <>
                  <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-amber-400">
                    Objetivo del programa
                  </h2>
                  <p className="mt-3 text-lg leading-8 text-slate-200">
                    {program.objective}
                  </p>
                </>
              )}

              {program.specificObjectives.length > 0 && (
                <>
                  <h2 className="mt-8 text-sm font-semibold uppercase tracking-widest text-amber-400">
                    Objetivos específicos
                  </h2>
                  <ul className="mt-3 space-y-2.5">
                    {program.specificObjectives.map((objective) => (
                      <li
                        key={objective}
                        className="flex items-start gap-3 text-lg leading-8 text-slate-200"
                      >
                        <CheckIcon />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {program.targetAudience && (
                <>
                  <h2 className="mt-8 text-sm font-semibold uppercase tracking-widest text-amber-400">
                    Dirigido a
                  </h2>
                  <p className="mt-3 text-lg leading-8 text-slate-200">
                    {program.targetAudience}
                  </p>
                </>
              )}

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href={`/programas/${program.slug}/inscripcion`}
                  className="rounded-full bg-amber-400 px-8 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 hover:shadow-amber-300/30"
                >
                  Inscríbete ahora
                </Link>
                {program.videoUrl && (
                  <ProgramVideoModal
                    videoUrl={program.videoUrl}
                    title={program.title}
                  />
                )}
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

          {/* Ficha rápida (incluye carga horaria y características extra) */}
          {quickFacts.length > 0 && (
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
          )}

          {/* Malla académica */}
          {program.modules.length > 0 && (
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
          )}

          {/* Staff docente */}
          {program.teachers.length > 0 && (
            <section className="mt-20">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Staff <span className="text-amber-400">docente</span>
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {program.teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-amber-400/30 hover:bg-white/[0.07]"
                  >
                    <div className="flex items-center gap-4">
                      {teacher.photoUrl ? (
                        <Image
                          src={teacher.photoUrl}
                          alt={teacher.fullName}
                          width={80}
                          height={80}
                          className="h-20 w-20 shrink-0 rounded-full border-2 border-amber-400/40 object-cover"
                        />
                      ) : (
                        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-amber-400/40 bg-white/10 text-2xl font-bold text-amber-300">
                          {getInitials(teacher.fullName)}
                        </span>
                      )}
                      <div>
                        <p className="text-lg font-semibold leading-snug text-white">
                          {teacher.fullName}
                        </p>
                        {teacher.credentials && (
                          <p className="mt-1 text-sm leading-snug text-amber-300">
                            {teacher.credentials}
                          </p>
                        )}
                      </div>
                    </div>
                    {teacher.bio && (
                      <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-slate-300">
                        {teacher.bio}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Requisitos + Inversión (solo las secciones con datos) */}
          {(hasRequirements || hasInvestment) && (
            <div
              className={`mt-20 grid gap-8 ${
                hasRequirements && hasInvestment ? "lg:grid-cols-2" : ""
              }`}
            >
              {hasRequirements && (
                <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    Requisitos de{" "}
                    <span className="text-amber-400">admisión</span>
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
              )}

              {hasInvestment && (
                <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-8">
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    Inversión
                  </h2>
                  <dl className="mt-4 divide-y divide-white/10">
                    {program.enrollmentFee != null && (
                      <div className="flex items-baseline justify-between gap-4 py-4">
                        <dt className="text-slate-200">Matrícula</dt>
                        <dd className="text-2xl font-bold text-white">
                          {program.currency}{" "}
                          {formatAmount(program.enrollmentFee)}
                        </dd>
                      </div>
                    )}
                    {program.totalCost != null && (
                      <div className="flex items-baseline justify-between gap-4 py-4">
                        <dt className="font-semibold text-white">
                          Pago al contado
                        </dt>
                        <dd className="text-3xl font-bold text-amber-400">
                          {program.currency} {formatAmount(program.totalCost)}
                        </dd>
                      </div>
                    )}
                    {hasInstallments && program.installmentAmount != null && (
                      <div className="flex items-baseline justify-between gap-4 py-4">
                        <dt className="font-semibold text-white">
                          Plan de cuotas
                        </dt>
                        <dd className="text-right">
                          <span className="text-2xl font-bold text-white">
                            {program.installmentCurrency}{" "}
                            {formatAmount(program.installmentAmount)}
                          </span>
                          <span className="block text-sm text-slate-300">
                            {program.installmentCount != null
                              ? `en ${program.installmentCount} cuotas`
                              : "por cuota"}
                          </span>
                        </dd>
                      </div>
                    )}
                  </dl>
                  {program.paymentFacilities && (
                    <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-200">
                      {program.paymentFacilities}
                    </p>
                  )}
                </section>
              )}
            </div>
          )}

          {/* CTA de inscripción — siempre visible, aun sin datos de inversión */}
          <div className="mt-12 flex justify-center">
            <Link
              href={`/programas/${program.slug}/inscripcion`}
              className="block w-full max-w-xl rounded-full bg-amber-400 px-8 py-4 text-center text-lg font-semibold text-slate-950 shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 hover:shadow-amber-300/30"
            >
              Quiero inscribirme
            </Link>
          </div>

          {/* Medios de pago */}
          {hasPaymentChannels && (
            <section className="mt-20">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Medios de <span className="text-amber-400">pago</span>
              </h2>
              <div
                className={`mt-8 grid gap-6 ${
                  hasBankAccounts && program.qrImageUrl
                    ? "lg:grid-cols-[1.6fr_1fr]"
                    : ""
                }`}
              >
                {hasBankAccounts && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                    <h3 className="text-xl font-semibold text-white">
                      Depósito o transferencia bancaria
                    </h3>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {program.bankAccounts.map((account, index) => (
                        <div
                          key={`${account.accountNumber}-${index}`}
                          className="rounded-xl border border-white/10 bg-white/5 p-5"
                        >
                          <p className="text-sm font-semibold uppercase tracking-wide text-amber-300">
                            {account.bank}
                          </p>
                          <p className="mt-2 break-all font-mono text-xl font-semibold text-white">
                            {account.accountNumber}
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            Titular: {account.holder}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {program.qrImageUrl && (
                  <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                    <h3 className="text-xl font-semibold text-white">
                      Transacción con QR
                    </h3>
                    <div className="mt-6 rounded-2xl bg-white p-4">
                      <Image
                        src={program.qrImageUrl}
                        alt={`Código QR de pago de ${program.title}`}
                        width={240}
                        height={240}
                        className="h-auto w-52"
                      />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-300">
                      Escanea el código con la app de tu banco o billetera
                      móvil.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
