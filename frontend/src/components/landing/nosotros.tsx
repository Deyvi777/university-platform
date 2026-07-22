import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Eye,
  Gem,
  GraduationCap,
  Handshake,
  Headset,
  type LucideIcon,
  Monitor,
  Play,
  Rocket,
  ScrollText,
  Users,
} from "lucide-react";
import { getTeam } from "@/lib/api/team";
import { getPartners } from "@/lib/api/partners";
import { CleanYoutubePlayer } from "./clean-youtube-player";

const features = [
  {
    icon: GraduationCap,
    title: "Formación a la medida",
    description:
      "Capacitación, desarrollo corporativo y gestión académica para cada institución.",
    badge: "bg-blue-500/15 text-blue-400 ring-blue-400/20",
  },
  {
    icon: Handshake,
    title: "Alianzas acreditadas",
    description:
      "Universidades e instituciones reconocidas que avalan cada certificación.",
    badge: "bg-rose-500/15 text-rose-400 ring-rose-400/20",
  },
];

const values = [
  {
    title: "Excelencia",
    description: "Buscamos los más altos estándares de calidad en todos nuestros programas académicos y servicios.",
  },
  {
    title: "Ética",
    description: "Actuamos con honestidad, integridad, transparencia y responsabilidad en cada una de nuestras acciones.",
  },
  {
    title: "Innovación",
    description: "Promovemos la creatividad, la investigación y el uso de tecnologías emergentes para generar soluciones de alto impacto.",
  },
  {
    title: "Compromiso",
    description: "Trabajamos con vocación de servicio y responsabilidad para contribuir al crecimiento profesional e institucional de nuestros participantes y aliados.",
  },
  {
    title: "Calidad",
    description: "Impulsamos la mejora continua de nuestros procesos académicos, administrativos y organizacionales.",
  },
  {
    title: "Investigación",
    description: "Fomentamos la generación, aplicación y difusión del conocimiento científico como base del desarrollo.",
  },
  {
    title: "Liderazgo",
    description: "Formamos profesionales capaces de dirigir procesos de cambio y transformación en sus organizaciones y comunidades.",
  },
  {
    title: "Trabajo en Equipo",
    description: "Promovemos la colaboración, el respeto y la cooperación para alcanzar objetivos comunes.",
  },
  {
    title: "Responsabilidad Social",
    description: "Contribuimos al desarrollo de la sociedad mediante programas educativos, científicos y de fortalecimiento institucional con impacto positivo.",
  },
  {
    title: "Inclusión",
    description: "Garantizamos igualdad de oportunidades, respeto por la diversidad y acceso a una formación de calidad para todos.",
  },
];


export async function Nosotros() {
  const [team, partners] = await Promise.all([getTeam(), getPartners()]);

  return (
    <section id="nosotros" className="bg-slate-950 pb-24 pt-32 sm:pb-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* ── Presentación institucional ─────────────────────────── */}
        <div className="relative grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div
            aria-hidden="true"
            className="animate-pulse-glow pointer-events-none absolute -left-32 top-24 size-80 rounded-full bg-amber-400/[0.1] blur-[130px]"
          />
          <div className="relative">
            <p className="inline-flex items-center gap-2 border-b-2 border-amber-400 pb-1 text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
              <BookOpen className="size-5" aria-hidden="true" />
              ¿Quiénes somos?
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Educación que transforma profesionales e instituciones
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-200">
              Certificate Bolivia es una Escuela Multidisciplinaria de
              Postgrado y Formación Continua comprometida con el crecimiento
              académico, profesional e institucional de Bolivia.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/#programas"
                className="group inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3.5 font-semibold text-slate-950 shadow-lg shadow-amber-400/20 transition-all hover:-translate-y-0.5 hover:bg-amber-300"
              >
                Conoce nuestros programas
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="https://wa.me/59177933003"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 font-medium text-white transition-colors hover:border-white/50 hover:bg-white/10"
              >
                <Headset className="size-4" aria-hidden="true" />
                Hablar con un asesor
              </a>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl shadow-black/40 lg:mx-0 lg:justify-self-center">
            <CleanYoutubePlayer
              videoId="22fofXtXUhE"
              title="Certificate Bolivia: liderazgo con vocación de servicio"
            />
          </div>
        </div>

        {/* ── Identidad y trayectoria ────────────────────────────── */}
        <div className="mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <figure className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-xl shadow-black/30">
            <div className="relative aspect-[3/2]">
              <Image
                src="/landing/about/about-1.webp"
                alt="Dirección de Certificate Bolivia en la oficina central"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </figure>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-400">
              Nuestra identidad
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Formación, investigación e innovación con propósito
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-8 text-slate-200">
              <p>
                Somos una institución boliviana dedicada a la formación
                académica, la investigación, la consultoría y el desarrollo
                profesional de personas y organizaciones.
              </p>
              <p>
                Mediante alianzas con universidades e instituciones nacionales
                e internacionales desarrollamos doctorados, maestrías,
                especialidades, diplomados, educación continua y
                certificaciones con reconocimiento académico.
              </p>
              <p>
                La transformación digital, la investigación científica y las
                tecnologías emergentes son pilares de nuestra propuesta
                educativa.
              </p>
            </div>
          </div>
        </div>

        {/* ── Video institucional ────────────────────────────────── */}
        <section className="mt-24" aria-labelledby="video-institucional-title">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-amber-400">
              <Play className="size-4 fill-current" aria-hidden="true" />
              Conoce Certificate
            </p>
            <h2
              id="video-institucional-title"
              className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              Nuestra institución en acción
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Descubre el compromiso, las personas y la visión que impulsan
              cada experiencia de formación.
            </p>
          </div>
          <div className="mx-auto mt-10 aspect-video max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl shadow-black/40">
            <iframe
              src="https://www.youtube-nocookie.com/embed/CMndpTd1Lx0?rel=0&modestbranding=1"
              title="Video institucional de Certificate Bolivia"
              className="size-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </section>

        {/* ── Trabajo colaborativo ───────────────────────────────── */}
        <div className="mt-24 grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-400">
              Cómo trabajamos
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Acompañamiento cercano y alianzas que generan oportunidades
            </h2>
            <div className="mt-8 space-y-6">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <span
                    className={`flex size-12 shrink-0 items-center justify-center rounded-full ring-1 ${feature.badge}`}
                  >
                    <feature.icon className="size-6" aria-hidden="true" />
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
          </div>
          <figure className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-xl shadow-black/30">
            <div className="relative aspect-[3/2]">
              <Image
                src="/landing/about/about-4.webp"
                alt="Equipo de Certificate Bolivia planificando proyectos académicos"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          </figure>
        </div>

        {/* ── Resultado de la formación ──────────────────────────── */}
        <div className="mt-28 grid items-center gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <figure className="mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl shadow-black/40 lg:mx-0">
            <Image
              src="/landing/about/about-3.webp"
              alt="Graduada de Certificate Bolivia celebrando su logro académico"
              width={1066}
              height={1600}
              sizes="(max-width: 1024px) 90vw, 35vw"
              className="h-auto w-full"
            />
          </figure>
          <div className="relative overflow-hidden rounded-[2rem] border border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-white/5 to-transparent p-7 sm:p-10">
            <span
              aria-hidden="true"
              className="absolute -left-2 -top-4 font-serif text-8xl leading-none text-amber-400/15"
            >
              &ldquo;
            </span>
            <p className="relative text-xl leading-9 text-white sm:text-2xl">
              Creemos en la educación como motor de transformación. Cada logro
              de nuestros participantes representa una nueva oportunidad para
              sus organizaciones, sus comunidades y el país.
            </p>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
              El saber te da poder
            </p>
          </div>
        </div>

        {/* ── Misión · Visión · Valores ──────────────────────────── */}
        <div className="mt-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Misión, visión y valores
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              La esencia que guía cada programa, cada decisión y cada persona
              que formamos.
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-x-8 gap-y-24 md:grid-cols-2">
            <PillarCard icon={Rocket} title="Misión">
              <p className="leading-7 text-slate-200">
                Brindar servicios de educación superior, postgrado, formación
                continua, investigación, consultoría y fortalecimiento
                institucional mediante programas innovadores, alianzas
                estratégicas y tecnologías de vanguardia, formando
                profesionales competentes, éticos y comprometidos con Bolivia.
              </p>
            </PillarCard>

            <PillarCard icon={Eye} title="Visión">
              <p className="leading-7 text-slate-200">
                Ser la institución líder en Bolivia y un referente
                internacional en postgrado, formación continua, investigación
                e innovación, reconocida por la excelencia de sus programas y
                su contribución al desarrollo sostenible y la transformación
                digital.
              </p>
            </PillarCard>
          </div>

          <div className="mt-24">
            <PillarCard icon={Gem} title="Valores">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {values.map((value) => (
                  <div
                    key={value.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-amber-400/40"
                  >
                    <h3 className="font-semibold text-white">{value.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </PillarCard>
          </div>
        </div>

        {/* ── Equipo ───────────────────────────────────────────────── */}
        {team.length > 0 && (
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
                key={member.id}
                className="group relative flex flex-col rounded-3xl border border-white/10 bg-white/5 px-4 pb-6 pt-4 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-amber-400/40"
              >
                {/* Foto recortada con efecto de relieve */}
                <div className="relative flex h-72 w-full items-end justify-center rounded-2xl bg-gradient-to-b from-amber-400/[0.12] via-white/[0.04] to-transparent">
                  <Image
                    src={member.photoUrl}
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
        )}

        {/* ── Alianzas Estratégicas ─────────────────────────────────── */}
        <div className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex items-center gap-2 border-b-2 border-amber-400 pb-1 text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
              <Handshake className="h-5 w-5" />
              Alianzas Estratégicas
            </p>
            <h3 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Cooperación interinstitucional
            </h3>
          </div>

          {/* Texto descriptivo */}
          <p className="mx-auto mt-12 max-w-4xl text-center text-lg leading-8 text-slate-200">
            En <span className="font-semibold text-white">Certificate Bolivia S.R.L.</span> promovemos alianzas estratégicas con universidades, instituciones públicas y privadas, colegios profesionales y organismos nacionales e internacionales para fortalecer la calidad de nuestros programas y ampliar las oportunidades de formación. Estas alianzas nos permiten desarrollar programas de postgrado, formación continua, investigación, consultoría y certificación profesional, garantizando una oferta educativa pertinente, actualizada y respaldada por instituciones de reconocido prestigio.
          </p>

          {/* Grid de instituciones aliadas (desde /dashboard/partners) */}
          {partners.length > 0 && (
            <div className="mt-14">
              <h4 className="mb-8 text-center text-lg font-semibold text-slate-300">
                Instituciones con las que Certificate Bolivia mantiene o ha formado vínculos de cooperación
              </h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {partners.map((partner) => (
                  <div
                    key={partner.id}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm transition-colors hover:border-amber-400/40"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-white/20">
                      <Image
                        src={partner.logoUrl}
                        alt={partner.name}
                        width={80}
                        height={80}
                        className="h-full w-full object-contain p-1"
                      />
                    </span>
                    <span className="text-sm font-medium leading-snug text-slate-200">
                      {partner.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Oferta Académica ───────────────────────────────────── */}
        <div className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex items-center gap-2 border-b-2 border-amber-400 pb-1 text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
              <GraduationCap className="h-5 w-5" />
              Oferta Académica
            </p>
            <h3 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Formación de excelencia
            </h3>
          </div>

          <div className="mx-auto mt-10 max-w-4xl text-center text-lg leading-8 text-slate-200">
            <p>
              En <span className="font-semibold text-white">CERTIFICATE BOLIVIA, Escuela Multidisciplinaria de Postgrado y Formación Continua S.R.L.</span>, desarrollamos una oferta académica innovadora, flexible y orientada a las necesidades actuales de los profesionales, integrando excelencia académica, investigación, tecnología e innovación. Nuestros programas son impartidos en alianza con universidades e instituciones de reconocido prestigio, bajo modalidades presencial, virtual e híbrida, promoviendo una formación de alto nivel con enfoque práctico y multidisciplinario.
            </p>
          </div>

          {/* Grid de categorías */}
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Programas de Postgrado */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm transition-colors hover:border-amber-400/40">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/20">
                  <Award className="h-5 w-5 text-amber-400" />
                </span>
                <h4 className="font-bold text-white">Programas de Postgrado</h4>
              </div>
              <ul className="space-y-2.5 text-sm leading-6 text-slate-300">
                {["Doctorados", "Maestrías", "Especialidades", "Diplomados"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Formación Continua */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm transition-colors hover:border-amber-400/40">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/20">
                  <ScrollText className="h-5 w-5 text-amber-400" />
                </span>
                <h4 className="font-bold text-white">Formación Continua</h4>
              </div>
              <ul className="space-y-2.5 text-sm leading-6 text-slate-300">
                {["Cursos de Experto", "Cursos de Actualización Profesional", "Programas de Certificación", "Programas Ejecutivos", "Educación Corporativa"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Eventos Académicos */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm transition-colors hover:border-amber-400/40">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/20">
                  <Calendar className="h-5 w-5 text-amber-400" />
                </span>
                <h4 className="font-bold text-white">Eventos Académicos</h4>
              </div>
              <ul className="space-y-2.5 text-sm leading-6 text-slate-300">
                {["Congresos Nacionales e Internacionales", "Seminarios", "Simposios", "Talleres", "Conferencias", "Jornadas Académicas", "Foros Especializados"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Modalidades de Estudio */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm transition-colors hover:border-amber-400/40">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/20">
                  <Monitor className="h-5 w-5 text-amber-400" />
                </span>
                <h4 className="font-bold text-white">Modalidades de Estudio</h4>
              </div>
              <ul className="space-y-2.5 text-sm leading-6 text-slate-300">
                {["Virtual", "Presencial", "Semipresencial", "Híbrida"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mx-auto mt-12 max-w-4xl text-center text-lg leading-8 text-slate-300">
            Todos nuestros programas están orientados al fortalecimiento de competencias profesionales, la actualización permanente y la formación de líderes capaces de responder a los desafíos del entorno laboral, científico y tecnológico, contribuyendo al desarrollo profesional e institucional de Bolivia.
          </p>
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
