import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { ScrollLink } from "./scroll-link";
import { SOCIAL_DEFS } from "./social-defs";
import { getSiteSettings } from "@/lib/api/settings";

const MAPS_LINK =
  "https://www.google.com/maps/search/?api=1&query=CERTIFICATE+BOLIVIA+SRL+Cochabamba";

const navColumns = [
  {
    title: "Navegación",
    links: [
      { label: "Programas", href: "/#programas" },
      { label: "Nosotros", href: "/nosotros" },
      { label: "Instituciones", href: "/#instituciones-aliadas" },
      { label: "Contacto", href: "/contacto" },
    ],
  },
  {
    title: "Acceso",
    links: [
      { label: "Iniciar sesión", href: "/login" },
      { label: "Inscríbete", href: "/#programas" },
    ],
  },
];

export async function Footer() {
  const settings = await getSiteSettings();
  const socials = SOCIAL_DEFS.filter((s) => settings[s.key]);

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-slate-950">
      {/* Acento ámbar superior sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[600px] -translate-x-1/2 rounded-full bg-amber-400/[0.06] blur-[120px]"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr]">
          {/* Marca */}
          <div className="max-w-sm">
            <Link href="/" aria-label="Certificate — Inicio" className="inline-block">
              <Image
                src="/landing/logo.webp"
                alt="Certificate — Escuela Multidisciplinaria de Postgrado"
                width={150}
                height={64}
                className="h-12 w-auto"
              />
            </Link>
            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 flex items-start gap-3 text-sm text-slate-400 transition-colors hover:text-white"
            >
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <span>
                <span className="block font-semibold text-white">Dirección</span>
                Calle Jordán entre Esteban Arce y 25 de Mayo. Centro comercial
                COSCENTER
              </span>
            </a>

            {socials.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {socials.map((social) => (
                  <a
                    key={social.key}
                    href={settings[social.key] as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-300"
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
            )}
          </div>

          {/* Columnas de navegación */}
          {navColumns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold tracking-wide text-white">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <ScrollLink
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-amber-300"
                    >
                      {link.label}
                    </ScrollLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Barra inferior */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Certificate · Escuela Multidisciplinaria
            de Postgrado.
          </p>
          <p className="text-sm text-slate-500">
            Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
