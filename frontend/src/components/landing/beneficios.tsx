import Image from "next/image";
import {
  BadgeCheck,
  BadgePercent,
  BookOpen,
  Briefcase,
  CalendarClock,
  GraduationCap,
  MonitorSmartphone,
} from "lucide-react";

// Beneficios de estudiar en Certificate (sección de la home, bajo Programas).
const benefits = [
  {
    icon: BookOpen,
    lead: "Acceso a material exclusivo",
    text: "diseñado para cada módulo, facilitando el estudio de manera flexible.",
  },
  {
    icon: MonitorSmartphone,
    lead: "Material digital",
    text: "del programa disponible en nuestra plataforma 24/7.",
  },
  {
    icon: CalendarClock,
    lead: "Flexibilidad de horarios",
    text: "con clases en vivo a través de Zoom y con acceso ilimitado a las grabaciones para reforzar tu aprendizaje.",
  },
  {
    icon: Briefcase,
    lead: "Revisión de casos reales",
    text: "guiados por expertos que te ayudarán a aplicar los conceptos en situaciones concretas.",
  },
  {
    icon: GraduationCap,
    lead: "Docentes altamente calificados",
    text: "y con amplia experiencia profesional y académica, garantizando una enseñanza de alta calidad.",
  },
  {
    icon: BadgeCheck,
    lead: "Certificaciones adicionales gratuitas",
    text: "con 200 horas académicas avaladas por la UNSXX – CERTIFICATE BOLIVIA SRL, aumentando aún más el valor de tu formación.",
  },
];

export function Beneficios() {
  return (
    <section
      id="beneficios"
      className="scroll-mt-20 border-t border-white/5 bg-slate-950 py-10 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium tracking-wide text-amber-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Beneficios
          </p>

          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            Lo que ganas al estudiar{" "}
            <span className="text-amber-400">con nosotros</span>
          </h2>
        </div>

        <div className="mt-16 grid items-center gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-10">
          {/* Títulos y certificaciones — se muestra completa (proporción
              natural de la imagen, sin recorte ni degradado) */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 shadow-xl shadow-black/40 ring-1 ring-inset ring-white/10">
            <Image
              src="/landing/titulos.webp"
              alt="Títulos y certificaciones de maestrías, diplomados y formación continua avalados por la Universidad Nacional Siglo XX"
              width={1235}
              height={1331}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="h-auto w-full transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Una tarjeta compacta por beneficio, en una sola columna */}
          <div className="flex flex-col gap-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.lead}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-colors hover:border-amber-400/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/20">
                  <benefit.icon className="h-5 w-5 text-amber-400" />
                </span>
                <p className="text-sm leading-6 text-slate-300">
                  <span className="font-bold text-amber-300">
                    {benefit.lead}
                  </span>{" "}
                  {benefit.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Beneficio destacado: descuento para alumnos */}
        <div className="mt-6 flex flex-col items-center gap-6 rounded-3xl border border-amber-400/30 bg-amber-400/5 p-8 text-center sm:flex-row sm:text-left">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-400/15 ring-1 ring-amber-400/30">
            <BadgePercent className="h-7 w-7 text-amber-400" />
          </span>
          <p className="flex-1 text-lg leading-8 text-slate-200">
            <span className="font-bold text-white">
              Beneficio exclusivo para alumnos
            </span>{" "}
            con un 10% de descuento en futuros cursos y programas ofrecidos por
            Certificate Bolivia SRL.
          </p>
          <span className="shrink-0 text-5xl font-extrabold tracking-tight text-amber-400 sm:text-6xl">
            10%
          </span>
        </div>
      </div>
    </section>
  );
}
