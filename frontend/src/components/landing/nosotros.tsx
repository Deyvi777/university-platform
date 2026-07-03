import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  Eye,
  Gem,
  GraduationCap,
  Handshake,
  Headset,
  Landmark,
  type LucideIcon,
  Monitor,
  Rocket,
  ScrollText,
  Users,
} from "lucide-react";
import { getTeam } from "@/lib/api/team";

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
  const team = await getTeam();

  return (
    <section id="nosotros" className="bg-slate-950 pb-24 pt-32 sm:pb-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* ── Encabezado ────────────────────────────────────────── */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 border-b-2 border-amber-400 pb-1 text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
            <BookOpen className="h-5 w-5" />
            ¿QUIÉNES SOMOS?
          </p>
          <h2 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            CERTIFICATE BOLIVIA, Escuela Multidisciplinaria de Postgrado y Formación Continua S.R.L.
          </h2>
        </div>

        {/* ── Bloque principal: collage + texto ────────────────────── */}
        <div className="mt-16 grid items-start gap-12 lg:grid-cols-5 lg:gap-14">
          {/* Collage de imágenes — 3 columnas de 5 */}
          <div className="relative lg:col-span-3">
            <div
              aria-hidden="true"
              className="animate-pulse-glow pointer-events-none absolute -left-10 top-1/4 -z-10 h-72 w-72 rounded-full bg-amber-400/[0.12] blur-[120px]"
            />
            <div className="grid grid-cols-2 items-stretch gap-4 sm:gap-5">
              {/* Columna izquierda: imagen vertical que ocupa toda la altura */}
              <div className="relative min-h-[320px] overflow-hidden rounded-[2rem] border border-white/10 sm:min-h-[400px]">
                <Image
                  src="/landing/abaout/about-3.webp"
                  alt="Profesional estudiando un programa de Certificate"
                  fill
                  sizes="(max-width: 1024px) 45vw, 35vw"
                  className="object-cover"
                />
              </div>

              {/* Columna derecha: dos imágenes horizontales */}
              <div className="space-y-4 sm:space-y-5">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/10">
                  <Image
                    src="/landing/abaout/about-1.webp"
                    alt="Equipo de profesionales en sesión de trabajo"
                    fill
                    sizes="(max-width: 1024px) 45vw, 18vw"
                    className="object-cover"
                  />
                </div>

                <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/10">
                  <Image
                    src="/landing/abaout/about-2.webp"
                    alt="Docente acompañando a una estudiante"
                    fill
                    sizes="(max-width: 1024px) 45vw, 18vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Texto descriptivo — 2 columnas de 5 */}
          <div className="space-y-6 text-lg leading-8 text-slate-200 lg:col-span-2">
            <p>
              Es una institución boliviana dedicada a la formación académica, la investigación, la consultoría y el desarrollo profesional, orientada a fortalecer las competencias de profesionales, instituciones públicas, empresas privadas y organizaciones de la sociedad civil.
            </p>
            <p>
              A través de alianzas estratégicas con universidades e instituciones nacionales e internacionales, desarrollamos programas de doctorado, maestría, especialidad, diplomado, cursos de experto, educación continua, congresos, seminarios y certificaciones, garantizando una formación de excelencia con reconocimiento académico.
            </p>
            <p>
              Nuestra institución promueve la innovación, la investigación científica, la transformación digital y el uso de tecnologías emergentes, incluyendo la inteligencia artificial, como pilares para impulsar el desarrollo del talento humano y el fortalecimiento institucional.
            </p>
          </div>
        </div>

        {/* ── Highlights + cita + CTA ──────────────────────────────── */}
        <div className="mt-16 grid items-start gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {/* Features */}
          <div className="space-y-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 ${feature.badge}`}
                >
                  <feature.icon className="h-6 w-6" />
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

          {/* Cita */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <span
              aria-hidden="true"
              className="absolute -left-2 -top-2 font-serif text-7xl leading-none text-amber-400/15"
            >
              &ldquo;
            </span>
            <p className="relative text-base leading-7 text-slate-200">
              Creemos firmemente en la educación como el gran motor de
              transformación, por lo que trabajamos cada día con el
              compromiso de impulsar el crecimiento profesional,
              institucional y social de toda Bolivia.
            </p>
            <span
              aria-hidden="true"
              className="mt-1 block text-right font-serif text-7xl leading-none text-amber-400/15"
            >
              &rdquo;
            </span>
          </div>

          {/* CTA + contacto */}
          <div className="flex flex-col justify-center gap-6 sm:col-span-2 lg:col-span-1">
            <Link
              href="/#programas"
              className="group inline-flex w-fit items-center gap-2 rounded-full bg-amber-400 px-7 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg shadow-amber-400/20 transition-all hover:-translate-y-0.5 hover:bg-amber-300"
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
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 ring-1 ring-blue-400/20 transition-colors group-hover:bg-blue-500/25">
                <Headset className="h-5 w-5 text-blue-400" />
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

        {/* ── Misión · Visión · Valores ────────────────────────────── */}
        <div className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Misión, visión y valores
            </h3>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              La esencia que guía cada programa, cada decisión y cada persona
              que formamos.
            </p>
          </div>

          {/* Misión + Visión — lado a lado */}
          <div className="mt-20 grid grid-cols-1 gap-x-8 gap-y-24 md:grid-cols-2">
            <PillarCard icon={Rocket} title="Misión">
              <p className="leading-7 text-slate-200">
                Brindar servicios de educación superior, postgrado, formación continua, investigación, consultoría y fortalecimiento institucional, mediante programas académicos innovadores, alianzas estratégicas nacionales e internacionales y el uso de tecnologías de vanguardia, formando profesionales altamente competentes, éticos y comprometidos con el desarrollo científico, tecnológico, empresarial y social de Bolivia.
              </p>
            </PillarCard>

            <PillarCard icon={Eye} title="Visión">
              <p className="leading-7 text-slate-200">
                Ser la institución líder en Bolivia y un referente internacional en educación de postgrado, formación continua, investigación, innovación y consultoría multidisciplinaria, reconocida por la excelencia de sus programas, la calidad de sus alianzas estratégicas y su contribución al desarrollo sostenible, la transformación digital y la formación de profesionales capaces de liderar los desafíos del futuro.
              </p>
            </PillarCard>
          </div>

          {/* Valores — mismo diseño PillarCard envolviendo el grid */}
          <div className="mt-24">
            <PillarCard icon={Gem} title="Valores">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {values.map((value) => (
                  <div
                    key={value.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-amber-400/40"
                  >
                    <h5 className="font-semibold text-white">{value.title}</h5>
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

          {/* Grid de instituciones aliadas */}
          <div className="mt-14">
            <h4 className="mb-8 text-center text-lg font-semibold text-slate-300">
              Instituciones con las que Certificate Bolivia mantiene o ha formado vínculos de cooperación
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Universidad Autónoma Tomás Frías", type: "university" },
                { name: "Universidad Nacional Siglo XX", type: "university" },
                { name: "Universidad San Francisco de Asís", type: "university" },
                { name: "Universidad Central", type: "university" },
                { name: "Colegio de Profesionales en Ciencias Administrativas y Empresariales de Cochabamba (CADEC)", type: "college" },
                { name: "Colegio de Psicólogos Cochabamba", type: "college" },
                { name: "Colegio de Santa Cruz", type: "college" },
                { name: "Colegio Departamental de Trabajadores Sociales Santa Cruz", type: "college" },
                { name: "Colegio Departamental de Trabajadores Sociales Cochabamba", type: "college" },
                { name: "Veterinaria Evet", type: "college" },
                { name: "Colegio de Trabajadores Sociales Oruro", type: "college" },
              ].map((institution) => (
                <div
                  key={institution.name}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm transition-colors hover:border-amber-400/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/20">
                    {institution.type === "university" ? (
                      <Landmark className="h-5 w-5 text-amber-400" />
                    ) : (
                      <Building2 className="h-5 w-5 text-amber-400" />
                    )}
                  </span>
                  <span className="text-sm font-medium leading-snug text-slate-200">
                    {institution.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
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
