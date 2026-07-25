import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { ScrollLink } from "./scroll-link";
import {
  hasConfiguredSocialLinks,
  SocialLinks,
} from "./social-links";
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
  const hasSocials = hasConfiguredSocialLinks(settings);

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
        {hasSocials && (
          <div className="mb-12 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.035] to-amber-400/[0.06] p-5 shadow-2xl shadow-black/20 sm:p-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-md">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">
                  Nuestra comunidad
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                  Conecta con Certificate
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Sigue nuestras novedades, actividades y experiencias
                  académicas.
                </p>
              </div>
              <SocialLinks settings={settings} variant="footer" />
            </div>
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr]">
          {/* Marca */}
          <div className="max-w-sm">
            <Link href="/" aria-label="Certificate — Inicio" className="inline-block">
              <Image
                src="/landing/logo.webp"
                alt="Certificate — Escuela Multidisciplinaria de Postgrado"
                width={225}
                height={96}
                className="h-20 w-auto"
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
                <span className="block font-semibold text-white">OFICINA CENTRAL</span>
                Calle Jordán N°333 entre 25 de mayo y Esteban Arce. Edificio COSCENTER, 1° piso / Of. 7B
                <span className="mt-1 block font-medium text-slate-300">
                  Cochabamba - Bolivia
                </span>
              </span>
            </a>

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
