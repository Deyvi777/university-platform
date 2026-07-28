"use client";

import { GraduationCap, UserRoundCheck, Award } from "lucide-react";

const stats = [
  {
    value: "+40",
    label: "Programas de postgrado",
    icon: GraduationCap,
    badge: "bg-blue-500/15 text-blue-400 ring-blue-400/20",
  },
  {
    value: "+5.000",
    label: "Profesionales certificados",
    icon: UserRoundCheck,
    badge: "bg-rose-500/15 text-rose-400 ring-rose-400/20",
  },
  {
    value: "100%",
    label: "Docentes con grado de maestría",
    icon: Award,
    badge: "bg-blue-500/15 text-blue-400 ring-blue-400/20",
  },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

// WhatsApp de Certificate (formato internacional sin "+") + mensaje predefinido.
const WHATSAPP_NUMBER = "59177933003";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "¡Hola! Me gustaría hablar con un asesor sobre los programas de postgrado de Certificate.",
)}`;

export function Hero() {
  return (
    <section id="inicio" className="relative flex min-h-svh flex-col justify-center overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover object-[35%_center] sm:object-center"
        src="/landing/hero-video.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/20 lg:via-slate-950/65 lg:to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/90 to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-6 pt-32 pb-20 lg:px-8">
        <div className="max-w-xl lg:max-w-2xl">
          <p className="mb-6 text-lg font-medium tracking-wide text-amber-300">
            Escuela Multidisciplinaria de Postgrado
          </p>

          <h1 className="max-w-[32rem] text-[2.5rem] leading-[1.02] font-semibold tracking-tight text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.35)] sm:text-5xl lg:max-w-xl lg:text-[3.5rem]">
            <span className="block">Impulsa tu carrera</span>
            <span className="mt-2 block text-[0.72em] leading-[1.12] font-medium tracking-[-0.02em] text-slate-100 sm:text-[0.74em]">
              con maestrías y diplomados
            </span>
            <span className="mt-1 block">de excelencia</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-200">
            Formación continua para profesionales que buscan liderar. Programas
            acreditados, docentes expertos y modalidades flexibles diseñadas
            para tu crecimiento académico y laboral.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => scrollTo("programas")}
              className="rounded-full bg-amber-400 px-8 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 hover:shadow-amber-300/30"
            >
              Explorar programas
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/30 px-8 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/10"
            >
              Hablar con un asesor
            </a>
          </div>

          <dl className="mt-16 grid max-w-xl grid-cols-3 gap-4 border-t border-white/15 pt-8 sm:gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full ring-1 ${stat.badge}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <dt className="order-last mt-1 text-xs leading-snug text-slate-300 sm:text-sm">
                    {stat.label}
                  </dt>
                  <dd className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                    {stat.value}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </section>
  );
}
