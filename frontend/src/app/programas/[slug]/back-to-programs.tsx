"use client";

import { useRouter } from "next/navigation";

// "Volver a programas": navegamos hacia adelante (no `router.back()`/popstate, que
// NO dispara la integración de View Transitions de Next) hacia la URL exacta del
// landing desde la que se entró. Así el morph de `<ViewTransition>` lleva la
// imagen y el título de vuelta a su card de origen. La posición de scroll se
// restaura en el landing (`RestoreLandingScroll`) dentro del commit, por eso
// navegamos con `scroll: false` (evita el salto al tope y deja que el morph
// aterrice en la posición real de la card).
export function BackToPrograms() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        try {
          const raw = sessionStorage.getItem("landingReturn");
          if (raw) {
            const data = JSON.parse(raw) as { href?: string };
            sessionStorage.setItem("landingRestore", "1");
            router.push(data.href || "/#programas", { scroll: false });
            return;
          }
        } catch {
          // sessionStorage no disponible: caemos al comportamiento por defecto.
        }
        // Entrada directa al programa (sin historial del landing): a la sección.
        router.push("/#programas");
      }}
      className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 py-2 pl-2.5 pr-5 text-sm font-medium text-slate-300 backdrop-blur-sm transition-all duration-300 hover:border-amber-400/30 hover:bg-white/10 hover:text-white hover:shadow-[0_0_24px_-6px_rgba(251,191,36,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 transition-all duration-300 group-hover:bg-amber-400 group-hover:text-slate-950">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </span>
      Volver a programas
    </button>
  );
}
