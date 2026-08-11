import { CirclePlay, LibraryBig } from "lucide-react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { TutorialVideoGrid } from "./tutorial-video-grid";

export const metadata = {
  title: "Tutoriales",
};

const STUDENT_TUTORIALS = [
  {
    id: "l8nYCITHSpk",
    title:
      "Tutorial plataforma educativa Certificate Bolivia (Estudiantes parte 1)",
    description:
      "En este video aprenderás a como ingresar a la plataforma educativa de Certificate Bolivia.",
  },
  {
    id: "TA-_76XulX0",
    title:
      "Tutorial plataforma educativa Certificate Bolivia (Estudiantes parte 2)",
    description:
      "En este video aprenderemos como entregar actividades y realizar exámenes en la plataforma educativa de Certificate Bolivia",
  },
  {
    id: "-aAi-AvGtxk",
    title:
      "Tutorial plataforma educativa Certificate Bolivia (Estudiantes parte 3)",
    description:
      "En este video veremos las funcionalidades del calendario, notificaciones y kárdex de calificaciones en la plataforma educativa Certificate Bolivia.",
  },
] as const;

const PROFESSOR_TUTORIALS = [
  {
    id: "XMuI_VFy4Ug",
    title:
      "Tutorial uso de la Plataforma Virtual para Docentes Certifícate (parte 1)",
    description:
      "Este video explica el uso de la plataforma virtual de Certifícate para que el docente pueda subir contenido (textos y videos) para sus estudiantes.",
  },
  {
    id: "xoCfKQtqcxo",
    title:
      "Tutorial uso de la Plataforma Virtual para Docentes Certifícate (parte 2)",
    description:
      "En este video aprenderás a crear diferentes tipos de actividades para tus estudiantes en la plataforma Certifícate Bolivia",
  },
] as const;

export default async function TutorialsPage() {
  const session = await requireUser();

  const role = session.user.role;

  if (role !== "STUDENT" && role !== "PROFESSOR") {
    redirect("/dashboard");
  }

  const tutorials =
    role === "PROFESSOR" ? PROFESSOR_TUTORIALS : STUDENT_TUTORIALS;

  return (
    <div className="w-full">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-900 to-blue-950 px-5 py-7 text-white shadow-lg shadow-blue-950/10 ring-1 ring-white/5 sm:px-8 sm:py-9">
        <span
          className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/[0.08] blur-3xl"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-amber-300/[0.08] blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex max-w-3xl items-start gap-4 sm:gap-5">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-300 ring-1 ring-white/15 sm:size-14"
            aria-hidden="true"
          >
            <LibraryBig className="size-6 sm:size-7" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/80">
              Centro de ayuda
            </p>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Tutoriales
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/85 sm:text-base">
              Aprende a utilizar la plataforma con estas guías en video. Puedes
              verlas en el orden que prefieras y repetirlas cuando lo necesites.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15">
              <CirclePlay className="size-4 text-amber-300" aria-hidden="true" />
              {tutorials.length} videos disponibles
            </span>
          </div>
        </div>
      </header>

      <section aria-labelledby="videos-tutoriales" className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Guías de uso</p>
            <h2
              id="videos-tutoriales"
              className="mt-0.5 font-heading text-xl font-bold tracking-tight sm:text-2xl"
            >
              Explora los tutoriales
            </h2>
          </div>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Selecciona un video para comenzar
          </p>
        </div>

        <TutorialVideoGrid tutorials={tutorials} />
      </section>
    </div>
  );
}
