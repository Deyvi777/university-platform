import {
  ArrowLeft,
  Cookie,
  Database,
  LockKeyhole,
  Mail,
  MapPin,
  Scale,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PrivacyTableOfContents } from "./privacy-table-of-contents";

export const metadata: Metadata = {
  title: "Política de privacidad | Certificate Bolivia",
  description:
    "Políticas de privacidad, protección y tratamiento de datos personales de Certificate Bolivia S.R.L.",
};

const COLLECTED_DATA = [
  "Nombres y apellidos.",
  "Número de documento de identidad.",
  "Correo electrónico y número de teléfono.",
  "Información académica y profesional.",
  "Datos necesarios para inscripción, matrícula y certificación.",
  "Información relacionada con pagos y facturación.",
  "Datos de acceso al sistema virtual.",
  "Información sobre cursos, actividades, evaluaciones y calificaciones.",
  "Dirección IP, dispositivo, navegador y otros datos técnicos necesarios para la seguridad y funcionamiento de la plataforma.",
];

const PURPOSES = [
  "Gestionar consultas, registros, inscripciones y matrículas.",
  "Administrar los programas académicos, diplomados, cursos y certificaciones.",
  "Crear y administrar cuentas de usuario en el sistema virtual.",
  "Permitir el acceso a clases, materiales y actividades académicas.",
  "Gestionar evaluaciones, calificaciones y seguimiento académico.",
  "Emitir certificados, diplomas y constancias.",
  "Gestionar pagos, facturación y procesos administrativos.",
  "Mantener comunicación con estudiantes y usuarios.",
  "Mejorar los servicios académicos y tecnológicos.",
  "Garantizar la seguridad de los sistemas y prevenir usos indebidos.",
  "Cumplir obligaciones legales y administrativas.",
  "Enviar información institucional, académica o promocional cuando corresponda y exista autorización para ello.",
];

const RETENTION_REASONS = [
  "Cumplir obligaciones legales.",
  "Cumplir obligaciones contractuales.",
  "Mantener registros académicos.",
  "Emitir o verificar certificaciones.",
  "Resolver controversias o reclamos.",
  "Cumplir obligaciones administrativas, tributarias o contables.",
  "Ejercer o defender derechos ante autoridades competentes.",
];

export default function PrivacyPage() {
  return (
    <main className="min-h-svh bg-slate-950 text-slate-200">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
          <Link
            href="/"
            aria-label="Certificate — Inicio"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
          >
            <Image
              src="/landing/logo.webp"
              alt="Certificate"
              width={180}
              height={77}
              priority
              className="h-12 w-auto"
            />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver al inicio de sesión
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="pointer-events-none absolute -right-20 -top-28 size-96 rounded-full bg-blue-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 left-1/4 size-80 rounded-full bg-amber-400/[0.08] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-5xl px-6 py-14 text-center sm:py-20 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Legal y privacidad
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl font-heading text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Políticas de privacidad, protección y tratamiento de datos personales
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Certificate Bolivia S.R.L. · Escuela Multidisciplinaria de Postgrado
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Documento institucional vigente
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <details className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 lg:hidden">
              <summary className="cursor-pointer list-none font-heading text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60">
                Contenido de la política
              </summary>
              <PrivacyTableOfContents className="mt-4 space-y-0.5 border-t border-white/10 pt-4" />
            </details>

            <nav
              aria-label="Contenido de la política"
              className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 lg:block"
            >
              <p className="font-heading text-sm font-semibold text-white">
                Contenido
              </p>
              <PrivacyTableOfContents className="mt-4 space-y-0.5" />
            </nav>
          </aside>

          <article className="min-w-0 space-y-5">
            <PolicySection
              id="identificacion-del-responsable"
              title="1. Identificación del responsable"
              icon={<ShieldCheck className="size-5" aria-hidden="true" />}
            >
              <p>
                <strong>CERTIFICATE BOLIVIA S.R.L.</strong>, en adelante{" "}
                <strong>“CERTIFICATE”</strong>, es responsable del tratamiento y
                protección de los datos personales recopilados mediante su sitio
                web, sistema virtual, formularios de inscripción, plataformas
                académicas y demás canales institucionales.
              </p>
              <address className="not-italic">
                <ContactRow icon={<MapPin className="size-4" aria-hidden="true" />}>
                  <strong>Dirección:</strong> Calle Jordán Nº 333 entre 25 de Mayo
                  y Esteban Arce, Edificio COSCENTER, 1.er piso, Oficina 7B,
                  Cochabamba – Bolivia.
                </ContactRow>
                <p><strong>NIT:</strong> 401963023</p>
                <ContactRow icon={<Mail className="size-4" aria-hidden="true" />}>
                  <strong>Correo electrónico:</strong>{" "}
                  <a href="mailto:info@certificatebolivia.com.bo" className="text-amber-300 underline underline-offset-2 hover:text-amber-200">
                    info@certificatebolivia.com.bo
                  </a>
                </ContactRow>
                <p>
                  <strong>Teléfono:</strong>{" "}
                  <a href="tel:+59177933003" className="text-amber-300 underline underline-offset-2 hover:text-amber-200">
                    +591 77933003
                  </a>
                </p>
                <p>
                  <strong>Sitio web:</strong>{" "}
                  <a href="https://certificatebolivia.com.bo" className="text-amber-300 underline underline-offset-2 hover:text-amber-200">
                    certificatebolivia.com.bo
                  </a>
                </p>
              </address>
            </PolicySection>

            <PolicySection
              id="datos-que-recopilamos"
              title="2. Datos que recopilamos"
              icon={<Database className="size-5" aria-hidden="true" />}
            >
              <p>Dependiendo del servicio utilizado, CERTIFICATE podrá recopilar:</p>
              <PolicyList items={COLLECTED_DATA} />
              <p>
                CERTIFICATE recopilará únicamente los datos que sean necesarios
                para la prestación de sus servicios y el cumplimiento de las
                finalidades informadas.
              </p>
            </PolicySection>

            <PolicySection id="finalidad-del-tratamiento" title="3. Finalidad del tratamiento">
              <p>Los datos personales serán utilizados para:</p>
              <PolicyList items={PURPOSES} />
            </PolicySection>

            <PolicySection id="tratamiento-sistema-virtual" title="4. Tratamiento en el sistema virtual">
              <p>
                El sistema virtual de CERTIFICATE podrá registrar información
                relacionada con el acceso y participación del estudiante,
                incluyendo cursos inscritos, materiales consultados, actividades,
                evaluaciones, calificaciones y participación en clases virtuales.
              </p>
              <p>
                Estos datos serán utilizados exclusivamente para fines académicos,
                administrativos, de seguimiento y gestión del servicio educativo.
              </p>
            </PolicySection>

            <PolicySection
              id="confidencialidad-y-seguridad"
              title="5. Confidencialidad y seguridad"
              icon={<LockKeyhole className="size-5" aria-hidden="true" />}
            >
              <p>
                CERTIFICATE se compromete a proteger la información personal y
                mantener su confidencialidad.
              </p>
              <p>
                Se aplicarán medidas técnicas y administrativas razonables para
                prevenir accesos no autorizados, pérdida, alteración, divulgación
                o uso indebido de los datos.
              </p>
              <p>
                El acceso a la información estará limitado al personal autorizado
                que necesite utilizarla para cumplir sus funciones.
              </p>
            </PolicySection>

            <PolicySection id="comunicacion-de-datos" title="6. Comunicación de datos">
              <p>
                CERTIFICATE <strong>no vende ni comercializa los datos personales</strong>{" "}
                de sus usuarios.
              </p>
              <p>
                La información podrá ser comunicada a proveedores tecnológicos,
                plataformas educativas, servicios de pago, instituciones académicas
                aliadas u otros terceros únicamente cuando sea necesario para
                prestar los servicios contratados, cumplir las finalidades
                informadas o atender obligaciones legales.
              </p>
              <p>
                Cuando corresponda, dichas entidades deberán mantener la
                confidencialidad y seguridad de la información.
              </p>
            </PolicySection>

            <PolicySection id="conservacion-de-los-datos" title="7. Conservación de los datos">
              <p>
                CERTIFICATE conservará los datos personales durante el tiempo que
                resulte necesario para cumplir las finalidades para las cuales
                fueron recopilados.
              </p>
              <p>Asimismo, determinados datos podrán conservarse durante el tiempo necesario para:</p>
              <PolicyList items={RETENTION_REASONS} />
              <p>
                Una vez que los datos dejen de ser necesarios, CERTIFICATE podrá
                proceder a su eliminación, anonimización o conservación cuando
                exista una obligación legal o legítima que justifique su
                mantenimiento.
              </p>
            </PolicySection>

            <PolicySection
              id="derechos-del-titular"
              title="8. Derechos del titular"
              icon={<UserRoundCheck className="size-5" aria-hidden="true" />}
            >
              <p>
                El titular de los datos personales podrá ejercer, conforme a la
                normativa boliviana aplicable, los derechos que correspondan
                respecto de su información, incluyendo:
              </p>
              <RightsList />
              <p>
                El ejercicio de estos derechos estará sujeto a los requisitos
                necesarios para verificar razonablemente la identidad del
                solicitante y evitar accesos indebidos a información personal.
              </p>
            </PolicySection>

            <PolicySection
              id="responsabilidad-del-usuario"
              title="9. Responsabilidad del usuario"
              icon={<ShieldCheck className="size-5" aria-hidden="true" />}
            >
              <p>
                El usuario será responsable de proporcionar información verdadera,
                completa y actualizada.
              </p>
              <div className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.07] p-4 text-white">
                <p>
                  Asimismo, deberá mantener la confidencialidad de sus credenciales
                  de acceso al sistema virtual y evitar compartir su usuario,
                  contraseña u otros mecanismos de autenticación con terceros.
                </p>
              </div>
              <p>
                CERTIFICATE no será responsable por accesos realizados mediante
                credenciales legítimamente asignadas al usuario cuando dichos
                accesos sean consecuencia de la negligencia del propio titular en
                la protección de sus credenciales.
              </p>
            </PolicySection>

            <PolicySection
              id="cookies"
              title="10. Cookies"
              icon={<Cookie className="size-5" aria-hidden="true" />}
            >
              <p>
                El sitio web y las plataformas de CERTIFICATE podrán utilizar
                cookies y tecnologías similares para mejorar la navegación,
                mantener sesiones, recordar preferencias y obtener información
                estadística sobre el uso de los servicios.
              </p>
              <p>
                El usuario podrá administrar o desactivar las cookies mediante la
                configuración de su navegador. Algunas funcionalidades podrían
                verse afectadas al deshabilitarlas.
              </p>
            </PolicySection>

            <PolicySection id="actualizaciones" title="11. Actualizaciones">
              <p>
                CERTIFICATE podrá actualizar esta Política de Privacidad cuando
                sea necesario debido a cambios en sus servicios, plataformas,
                procesos internos o normativa aplicable.
              </p>
              <p>
                La versión vigente estará disponible en el sitio web institucional
                y se indicará la fecha de su última actualización.
              </p>
            </PolicySection>

            <PolicySection
              id="legislacion-aplicable"
              title="12. Legislación aplicable"
              icon={<Scale className="size-5" aria-hidden="true" />}
            >
              <p>
                La presente Política se interpretará y aplicará de conformidad con
                la normativa vigente del Estado Plurinacional de Bolivia que
                resulte aplicable a la protección de datos personales, privacidad,
                tecnologías de información, comercio electrónico, comunicaciones y
                demás materias relacionadas con los servicios proporcionados por
                CERTIFICATE.
              </p>
              <p>
                En particular, se tendrán en consideración las garantías
                constitucionales relacionadas con la privacidad y protección de la
                intimidad, así como las disposiciones aplicables de la normativa
                boliviana sobre tecnologías de información y comunicación y
                protección de datos personales.
              </p>
            </PolicySection>

            <PolicySection id="aceptacion" title="14. Aceptación">
              <p>
                Al proporcionar sus datos personales, registrarse, solicitar
                información, inscribirse en un programa académico o utilizar los
                sistemas digitales de CERTIFICATE, el usuario declara haber tenido
                acceso a la presente Política de Privacidad y, cuando corresponda,
                presta su consentimiento para el tratamiento de sus datos personales
                conforme a las finalidades aquí descritas.
              </p>
              <p>
                Cuando el tratamiento requiera un consentimiento específico,
                CERTIFICATE habilitará el mecanismo correspondiente para que el
                titular pueda otorgarlo de manera libre, previa, expresa e informada.
              </p>
              <footer className="border-t border-white/10 pt-5 font-semibold text-white">
                <p>CERTIFICATE BOLIVIA S.R.L.</p>
                <p className="mt-1 text-sm font-normal text-slate-400">
                  Escuela Multidisciplinaria de Postgrado
                </p>
              </footer>
            </PolicySection>
          </article>
        </div>
      </div>
    </main>
  );
}

function PolicySection({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/10 sm:p-7"
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300 ring-1 ring-amber-300/15"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <h2 className="pt-1 font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
        {children}
      </div>
    </section>
  );
}

function PolicyList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-3 size-1.5 shrink-0 rounded-full bg-amber-300" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ContactRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-start gap-2">
      <span className="mt-2 text-amber-300" aria-hidden="true">{icon}</span>
      <span>{children}</span>
    </p>
  );
}

function RightsList() {
  const rights = [
    [
      "Derecho de acceso",
      "Solicitar información sobre los datos personales que CERTIFICATE mantiene respecto del titular y conocer las finalidades de su tratamiento.",
    ],
    [
      "Derecho de rectificación y actualización",
      "Solicitar la corrección o actualización de datos personales que sean incorrectos, incompletos o desactualizados.",
    ],
    [
      "Derecho de cancelación o supresión",
      "Solicitar la eliminación de datos personales cuando corresponda y siempre que no exista una obligación legal, contractual o causa legítima que requiera su conservación.",
    ],
    [
      "Derecho de oposición",
      "Oponerse al tratamiento de determinados datos cuando existan motivos legítimos para ello.",
    ],
    [
      "Derecho de revocación",
      "Solicitar la revocación del consentimiento previamente otorgado, cuando el tratamiento se base en dicho consentimiento.",
    ],
  ] as const;

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rights.map(([title, description]) => (
        <div key={title} className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <dt className="font-heading font-semibold text-white">{title}</dt>
          <dd className="mt-1 text-sm leading-6 text-slate-400">{description}</dd>
        </div>
      ))}
    </dl>
  );
}
