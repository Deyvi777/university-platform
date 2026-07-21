"use client";

import { usePathname } from "next/navigation";
import { SOCIAL_DEFS } from "@/components/landing/social-defs";

const WHATSAPP_URL = "https://wa.me/59177933003";
const WHATSAPP_PATH =
  SOCIAL_DEFS.find((social) => social.key === "whatsapp")?.path ?? "";

function isLandingRoute(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/nosotros" ||
    pathname === "/contacto" ||
    pathname === "/galeria" ||
    pathname.startsWith("/programas/")
  );
}

/** Acceso global a WhatsApp, visible únicamente en las rutas públicas del landing. */
export function FloatingWhatsAppButton() {
  const pathname = usePathname();

  if (!isLandingRoute(pathname)) return null;

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Contactarnos por WhatsApp al 77933003"
      className="group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-50 flex items-center gap-3 sm:bottom-[max(1.75rem,env(safe-area-inset-bottom))] sm:right-7"
    >
      <span className="hidden translate-x-2 rounded-2xl border border-white/15 bg-slate-950/90 px-4 py-2.5 text-right text-white opacity-0 shadow-2xl shadow-black/30 backdrop-blur-xl transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 sm:block">
        <span className="flex items-center justify-end gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5de98c]">
          <span className="size-1.5 rounded-full bg-[#25D366] shadow-[0_0_8px_#25D366]" />
          Estamos en línea
        </span>
        <span className="mt-0.5 block text-sm font-semibold">
          ¿Necesitas información? Escríbenos
        </span>
      </span>

      <span className="relative grid size-16 shrink-0 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_12px_35px_rgba(37,211,102,0.45)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:bg-[#20bd5a] group-focus-visible:-translate-y-1 group-focus-visible:scale-105 group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-white sm:size-[4.5rem]">
        <span
          className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/35 [animation-duration:2.4s] motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span
          className="absolute inset-1 rounded-full border border-white/25 bg-gradient-to-br from-white/20 via-transparent to-emerald-900/15"
          aria-hidden="true"
        />
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="relative size-8 drop-shadow-sm transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-110 sm:size-9"
        >
          <path d={WHATSAPP_PATH} />
        </svg>
      </span>
    </a>
  );
}
