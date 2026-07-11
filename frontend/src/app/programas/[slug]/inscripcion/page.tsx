import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { getProgramBySlug } from "@/lib/api/programs";
import { EnrollmentForm } from "./enrollment-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) return { title: "Programa no encontrado — Certificate" };
  return {
    title: `Inscripción — ${program.title} — Certificate`,
    description: `Formulario de inscripción al programa ${program.title}.`,
  };
}

export default async function InscripcionPage({ params }: Props) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  return (
    <>
      <Navbar />
      <main className="bg-slate-950 pb-24 pt-32">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <Link
            href={`/programas/${program.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al programa
          </Link>

          <div className="mt-8 text-center">
            <p className="mx-auto flex w-fit rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium tracking-wide text-amber-300 backdrop-blur-sm">
              Formulario de inscripción
            </p>
            <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
              {program.title}
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Completa tus datos y nuestro equipo se pondrá en contacto contigo
              para finalizar tu inscripción.
            </p>
          </div>

          <div className="mt-10">
            <EnrollmentForm
              programTitle={program.title}
              programSlug={program.slug}
            />
          </div>
        </div>
      </main>
    </>
  );
}
