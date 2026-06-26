"use client";

import { useEffect, useLayoutEffect } from "react";

// useLayoutEffect en SSR avisa; en cliente lo necesitamos para restaurar el
// scroll *antes del paint* (y dentro del commit de la navegación) de modo que el
// morph de View Transitions capture la posición final real de la card.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Restaura la posición de scroll del landing tras pulsar "Volver a programas".
// Solo actúa si el botón marcó `landingRestore` (no en una visita normal a la
// home ni al ir a otra ancla como #contacto), y consume las marcas una vez.
export function RestoreLandingScroll() {
  useIsomorphicLayoutEffect(() => {
    try {
      if (sessionStorage.getItem("landingRestore") !== "1") return;
      sessionStorage.removeItem("landingRestore");
      const raw = sessionStorage.getItem("landingReturn");
      if (!raw) return;
      const data = JSON.parse(raw) as { scrollY?: number };
      if (typeof data.scrollY === "number") {
        window.scrollTo(0, data.scrollY);
      }
    } catch {
      // sessionStorage no disponible: sin restauración.
    }
  }, []);

  return null;
}
