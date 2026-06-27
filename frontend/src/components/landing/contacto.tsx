import { MapPin, Phone, Clock, Headset } from "lucide-react";
import { ContactForm } from "./contact-form";
import { SOCIAL_DEFS } from "./social-defs";
import { getSiteSettings } from "@/lib/api/settings";

const ADDRESS =
  "Calle Jordán entre Esteban Arce y 25 de Mayo. Centro comercial COSCENTER";
const WHATSAPP_NUMBER = "59177933003";
const WHATSAPP_DISPLAY = "+591 77933003";
const MAPS_LINK =
  "https://www.google.com/maps/search/?api=1&query=CERTIFICATE+BOLIVIA+SRL+Cochabamba";

export async function Contacto() {
  const settings = await getSiteSettings();
  const socials = SOCIAL_DEFS.filter((s) => settings[s.key]);

  return (
    <section
      id="contacto"
      className="relative isolate overflow-hidden bg-slate-950 pb-24 pt-32 sm:pt-36"
    >
      {/* Resplandores ámbar decorativos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 h-[480px] w-[480px] translate-x-1/3 rounded-full bg-amber-400/[0.07] blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-[420px] w-[420px] -translate-x-1/3 rounded-full bg-amber-400/[0.05] blur-[130px]"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-6 inline-flex items-center gap-2 border-b-2 border-amber-400 pb-1 text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
            <Headset className="h-5 w-5" />
            Contacto
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Conversemos sobre tu <span className="text-white">futuro profesional</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Déjanos tus datos y un asesor académico te contactará. También puedes
            visitarnos o escribirnos directamente por WhatsApp.
          </p>
        </div>

        {/* Grid principal: formulario + información */}
        <div className="mt-16 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Formulario */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-sm sm:p-9">
            <h2 className="text-xl font-semibold text-white">
              Envíanos un mensaje
            </h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Completa el formulario y conversemos por WhatsApp.
            </p>
            <div className="mt-7">
              <ContactForm />
            </div>
          </div>

          {/* Información de contacto */}
          <div className="flex flex-col gap-5">
            {/* Dirección */}
            <InfoCard
              icon={<MapPin className="h-5 w-5" />}
              title="Dirección"
              badge="bg-blue-500/15 text-blue-400 ring-blue-400/20"
            >
              <p className="text-sm leading-6 text-slate-300">{ADDRESS}</p>
              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-amber-300 transition-colors hover:text-amber-200"
              >
                Ver en Google Maps
                <span aria-hidden="true">→</span>
              </a>
            </InfoCard>

            {/* WhatsApp / Teléfono */}
            <InfoCard
              icon={<Phone className="h-5 w-5" />}
              title="Teléfono / WhatsApp"
              badge="bg-rose-500/15 text-rose-400 ring-rose-400/20"
            >
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-slate-300 transition-colors hover:text-amber-300"
              >
                {WHATSAPP_DISPLAY}
              </a>
            </InfoCard>

            {/* Horario */}
            <InfoCard
              icon={<Clock className="h-5 w-5" />}
              title="Horario de atención"
              badge="bg-blue-500/15 text-blue-400 ring-blue-400/20"
            >
              <p className="text-sm leading-6 text-slate-300">
                Lunes a viernes · 8:30 – 19:00
                <br />
                Sábados · 9:00 – 13:00
              </p>
            </InfoCard>

            {/* Redes sociales */}
            {socials.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-sm font-semibold text-white">Síguenos</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {socials.map((social) => (
                    <a
                      key={social.key}
                      href={settings[social.key] as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="group flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-300"
                    >
                      <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d={social.path} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mapa de Google Maps */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl">
          <iframe
            title="Ubicación de Certificate Bolivia SRL en Google Maps"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6558.750511790351!2d-66.15831002295452!3d-17.395110564408018!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x93e3735e24be2f3b%3A0x7214041172750363!2sCERTIFICATE%20BOLIVIA%20SRL!5e1!3m2!1ses-419!2sbo!4v1782490601439!5m2!1ses-419!2sbo"
            width="600"
            height="450"
            className="h-[360px] w-full sm:h-[450px]"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  icon,
  title,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ${badge}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}
