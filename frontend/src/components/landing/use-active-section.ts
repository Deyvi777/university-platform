"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const SECTION_IDS = ["inicio", "programas", "nosotros", "contacto"];

/**
 * Sección activa según la ruta. Cada página del landing monta su propio
 * `<Navbar />`, así que el hook se remonta al navegar entre `/`, `/nosotros`
 * y `/contacto`: el valor inicial debe derivarse del pathname, no fijarse en
 * "inicio", o al aterrizar en otra página se marcaría "Inicio" por error.
 */
function sectionForPathname(pathname: string): string {
  if (pathname === "/nosotros") return "nosotros";
  if (pathname === "/galeria") return "galeria";
  if (pathname === "/contacto") return "contacto";
  if (pathname === "/") return "inicio";
  // Rutas sin sección propia (p. ej. /programas/[slug]): nada marcado.
  return "";
}

export function useActiveSection() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>(() =>
    sectionForPathname(pathname),
  );
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Sync URL-derived state during render (not in an effect) — see AGENTS.md
  // (react-hooks/set-state-in-effect). En "/" no se toca: lo refina el
  // IntersectionObserver según la sección visible al hacer scroll.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (pathname !== "/") {
      setActiveSection(sectionForPathname(pathname));
    }
  }

  useEffect(() => {
    // Only observe scroll-based sections on the landing page.
    if (pathname !== "/") return;

    const observers: IntersectionObserver[] = [];
    const visibleSections = new Map<string, number>();

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visibleSections.set(id, entry.intersectionRatio);
            } else {
              visibleSections.delete(id);
            }
          });

          // Pick the section with the highest visibility ratio
          let best = "";
          let bestRatio = 0;
          visibleSections.forEach((ratio, sectionId) => {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              best = sectionId;
            }
          });

          if (best) setActiveSection(best);
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: "-80px 0px 0px 0px" }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [pathname]);

  return activeSection;
}
