"use client";

const stats = [
  { value: "+40", label: "Programas de postgrado" },
  { value: "+5.000", label: "Profesionales certificados" },
  { value: "100%", label: "Docentes con grado de maestría" },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function Hero() {
  return (
    <section id="inicio" className="relative flex min-h-svh flex-col justify-center overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/landing/hero-video.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/90 to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-6 pt-32 pb-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-6 text-lg font-medium tracking-wide text-amber-300">
            Escuela Multidisciplinaria de Postgrado
          </p>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Impulsa tu carrera con{" "}
            <span className="text-white">maestrías y diplomados</span> de
            excelencia
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">
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
            <button
              type="button"
              onClick={() => scrollTo("contacto")}
              className="rounded-full border border-white/30 px-8 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/10"
            >
              Hablar con un asesor
            </button>
          </div>

          <dl className="mt-16 grid max-w-xl grid-cols-3 gap-4 border-t border-white/15 pt-8 sm:gap-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="order-last mt-1 text-xs leading-snug text-slate-300 sm:text-sm">
                  {stat.label}
                </dt>
                <dd className="text-2xl font-bold text-white sm:text-3xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
