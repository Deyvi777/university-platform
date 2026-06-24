import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Eye,
  Gem,
  GraduationCap,
  Handshake,
  Headset,
  type LucideIcon,
  MapPin,
  Quote,
  Rocket,
  Users,
} from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "Formación a la medida",
    description:
      "Capacitación, desarrollo corporativo y gestión académica para cada institución.",
  },
  {
    icon: Handshake,
    title: "Alianzas acreditadas",
    description:
      "Universidades e instituciones reconocidas que avalan cada certificación.",
  },
];

const values = [
  {
    title: "Empoderamiento",
    description: "Educamos para generar poder personal y profesional.",
  },
  {
    title: "Calidad",
    description: "Ofrecemos formación con alto estándar académico.",
  },
  {
    title: "Compromiso social",
    description: "Formamos para transformar realidades.",
  },
];

// NOTA: cargos provisionales — reemplazar con datos reales del equipo.
const team = [
  {
    image: "/landing/abaout/1-veronica.webp",
    name: "MS.C. Veronica Montoya",
    role: "Gerente General / Representante Legal",
  },
  {
    image: "/landing/abaout/2-karen.webp",
    name: "Lic. Karen Ugarte",
    role: "Directora Academica",
  },
  {
    image: "/landing/abaout/3-guisela.webp",
    name: "Ing. Guisela Lia Zubieta",
    role: "Directora de Marketing y Ventas",
  },
  {
    image: "/landing/abaout/4-laura.webp",
    name: "Ing. Laura Judith Claros",
    role: "Jefa de Ventas",
  },
];

export function Nosotros() {
  return (
    <section id="nosotros" className="bg-slate-950 pb-24 pt-32 sm:pb-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* ── Bloque principal: collage + contenido ────────────────── */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Collage de imágenes */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="animate-pulse-glow pointer-events-none absolute -left-10 top-1/4 -z-10 h-72 w-72 rounded-full bg-amber-400/[0.12] blur-[120px]"
            />
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              {/* Columna izquierda: imagen vertical + badge ámbar */}
              <div className="space-y-4 sm:space-y-5">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border border-white/10">
                  <Image
                    src="/landing/abaout/about-3.webp"
                    alt="Profesional estudiando un programa de Certificate"
                    fill
                    sizes="(max-width: 1024px) 45vw, 22vw"
                    className="object-cover"
                  />
                </div>

                <div className="flex items-center gap-4 rounded-[1.75rem] bg-amber-400 p-5 shadow-lg shadow-amber-400/20">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
                    <MapPin className="h-6 w-6 text-amber-500" />
                  </span>
                  <span className="text-sm font-bold leading-snug text-slate-950">
                    Sede en Cochabamba
                    <span className="block font-semibold text-slate-950/80">
                      Alcance nacional
                    </span>
                  </span>
                </div>
              </div>

              {/* Columna derecha: dos imágenes horizontales (formato 3:2) */}
              <div className="space-y-4 pt-10 sm:space-y-5 sm:pt-16">
                <div className="relative aspect-[3/2] overflow-hidden rounded-[2rem] border border-white/10">
                  <Image
                    src="/landing/abaout/about-1.webp"
                    alt="Equipo de profesionales en sesión de trabajo"
                    fill
                    sizes="(max-width: 1024px) 45vw, 22vw"
                    className="object-cover"
                  />
                </div>

                <div className="relative aspect-[3/2] overflow-hidden rounded-[2rem] border border-white/10">
                  <Image
                    src="/landing/abaout/about-2.webp"
                    alt="Docente acompañando a una estudiante"
                    fill
                    sizes="(max-width: 1024px) 45vw, 22vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div>
            <p className="inline-flex items-center gap-2 border-b-2 border-amber-400 pb-1 text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
              <BookOpen className="h-5 w-5" />
              Nosotros
            </p>

            <h2 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Potenciamos el capital humano que{" "}
              <span className="text-white">transforma Bolivia</span>
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-200">
              Somos una empresa boliviana con sede en Cochabamba, dedicada a
              potenciar el capital humano, la estructura y la cultura
              organizacional de instituciones públicas y privadas a nivel
              nacional. Como Escuela Multidisciplinaria de Postgrado y Formación
              Continua, diseñamos soluciones personalizadas en capacitación,
              desarrollo corporativo y gestión académica para responder de
              manera efectiva a las exigencias del entorno empresarial actual.
            </p>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              Respaldados por un equipo de profesionales expertos y sólidas
              alianzas con universidades e instituciones acreditadas, ofrecemos
              programas, talleres y certificaciones de la más alta calidad.
            </p>

            {/* Highlights + cita */}
            <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:gap-6">
              <div className="space-y-6">
                {features.map((feature) => (
                  <div key={feature.title} className="flex gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/20">
                      <feature.icon className="h-6 w-6 text-amber-400" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <Quote
                  aria-hidden="true"
                  className="absolute right-4 top-4 h-9 w-9 rotate-180 text-amber-400/20"
                />
                <p className="relative text-base leading-7 text-slate-200">
                  Creemos firmemente en la educación como el gran motor de
                  transformación, por lo que trabajamos cada día con el
                  compromiso de impulsar el crecimiento profesional,
                  institucional y social de toda Bolivia.
                </p>
                <span
                  aria-hidden="true"
                  className="mt-2 block text-right font-heading text-5xl font-black leading-none text-amber-400/30"
                >
                  99
                </span>
              </div>
            </div>

            {/* CTA + contacto */}
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              <Link
                href="/#programas"
                className="group inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg shadow-amber-400/20 transition-all hover:-translate-y-0.5 hover:bg-amber-300"
              >
                Conoce nuestros programas
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <a
                href="https://wa.me/+59177933003"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/20 transition-colors group-hover:bg-amber-400/20">
                  <Headset className="h-5 w-5 text-amber-400" />
                </span>
                <span>
                  <span className="block text-xs font-medium text-amber-300">
                    Escríbenos
                  </span>
                  <span className="block font-semibold text-white">
                    +591 77933003
                  </span>
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Misión · Visión · Valores ────────────────────────────── */}
        <div className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Misión, visión y <span className="text-white">valores</span>
            </h3>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              La esencia que guía cada programa, cada decisión y cada persona
              que formamos.
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-x-8 gap-y-24 md:grid-cols-3">
            <PillarCard icon={Rocket} title="Misión">
              <p className="leading-7 text-slate-200">
                Somos una institución dedicada a la formación de calidad en
                posgrado, capacitación continua y servicios empresariales, que
                promueve el empoderamiento mental mediante el conocimiento,
                generando nuevos pensamientos que construyen propósito y
                transforman realidades.
              </p>
            </PillarCard>

            <PillarCard icon={Eye} title="Visión">
              <p className="leading-7 text-slate-200">
                Ser una institución de referencia por impulsar el empoderamiento
                mental a través del conocimiento, con programas que impactan
                profesional y humanamente, integrando innovación, excelencia
                académica y compromiso con el cambio para el desarrollo de
                Bolivia.
              </p>
            </PillarCard>

            <PillarCard icon={Gem} title="Valores">
              <ul className="space-y-4 text-left leading-7 text-slate-300">
                {values.map((value) => (
                  <li key={value.title} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
                    />
                    <span>
                      <span className="font-semibold text-white">
                        {value.title}.
                      </span>{" "}
                      {value.description}
                    </span>
                  </li>
                ))}
              </ul>
            </PillarCard>
          </div>
        </div>

        {/* ── Equipo ───────────────────────────────────────────────── */}
        <div className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex items-center gap-2 border-b-2 border-amber-400 pb-1 text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
              <Users className="h-5 w-5" />
              Equipo
            </p>
            <h3 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Las personas que{" "}
              <span className="text-white">hacen posible Certificate</span>
            </h3>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Un equipo de profesionales comprometidos con tu crecimiento
              académico y profesional.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <article
                key={member.name}
                className="group relative flex flex-col rounded-3xl border border-white/10 bg-white/5 px-4 pb-6 pt-4 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-amber-400/40"
              >
                {/* Foto recortada con efecto de relieve */}
                <div className="relative flex h-72 w-full items-end justify-center rounded-2xl bg-gradient-to-b from-amber-400/[0.12] via-white/[0.04] to-transparent">
                  <Image
                    src={member.image}
                    alt={`${member.name} — ${member.role}`}
                    width={360}
                    height={540}
                    className="pointer-events-none h-[138%] w-auto origin-bottom object-contain object-bottom [filter:drop-shadow(0_18px_20px_rgba(2,6,23,0.65))] transition-transform duration-300 group-hover:scale-[1.08]"
                  />
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {member.name}
                  </span>
                </div>

                {/* Cuerpo */}
                <div className="mt-5 text-center">
                  <h4 className="text-lg font-bold tracking-tight text-amber-400">
                    {member.role}
                  </h4>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PillarCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full">
      {/* Cinta de encabezado (ribbon con muesca inferior) */}
      <div className="absolute -top-6 left-1/2 z-10 -translate-x-1/2 bg-gradient-to-b from-amber-300 to-amber-500 px-9 pb-7 pt-3 text-center text-base font-extrabold uppercase tracking-[0.2em] text-slate-950 [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)] [filter:drop-shadow(0_6px_10px_rgba(245,158,11,0.35))]">
        {title}
      </div>

      {/* Cuerpo de la tarjeta */}
      <div className="h-full rounded-3xl border border-white/10 bg-white/5 px-7 pb-20 pt-16 backdrop-blur-sm transition-colors hover:border-amber-400/40">
        {children}
      </div>

      {/* Insignia circular con icono */}
      <div className="absolute -bottom-11 left-1/2 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full border-2 border-amber-400 bg-slate-950 shadow-lg shadow-amber-400/10">
        <Icon className="h-11 w-11 text-amber-400" />
      </div>
    </div>
  );
}
