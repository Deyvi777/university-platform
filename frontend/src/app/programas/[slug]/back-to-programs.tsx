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
      className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
    >
      ← Volver a programas
    </button>
  );
}
