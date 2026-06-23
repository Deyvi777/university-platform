"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/**
 * Interruptor claro/oscuro tipo **píldora deslizante** (sol ⇄ luna), inspirado en
 * la referencia adjunta:
 *
 * - Pista (`track`) redondeada con dos iconos fijos: SOL a la izquierda, LUNA a la
 *   derecha. El icono del lado activo queda tenue/inactivo (lo tapa el thumb); el
 *   del lado opuesto se ve atenuado.
 * - `thumb` circular que se desliza con `transition-transform`:
 *     · claro  → thumb a la IZQUIERDA, ámbar (`amber-500`) con SOL blanco.
 *     · oscuro → thumb a la DERECHA, azul (`blue-500`) con LUNA blanca.
 * - Fondo de la pista cambia de gris muy claro (claro) a navy (oscuro).
 *
 * Accesibilidad: es un `<button role="switch">` con `aria-checked` (true = oscuro),
 * `aria-label`, operable por teclado (Enter/Espacio) y con foco visible (ring
 * ámbar). Las transiciones respetan `prefers-reduced-motion` vía utilidades
 * `motion-reduce:*`.
 *
 * Hidratación: next-themes solo conoce el tema en el cliente, así que renderizamos
 * el estado real recién montados (`useMounted`); antes mostramos un placeholder
 * neutro del mismo tamaño para evitar mismatch SSR y saltos de layout.
 */

/** `true` una vez montado en el cliente (sin `useEffect`, vía store externo). */
function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = resolvedTheme === "dark";

  // Placeholder con las mismas dimensiones mientras no está montado (evita CLS).
  if (!mounted) {
    return (
      <span
        className={cn(
          "inline-flex h-9 w-16 shrink-0 rounded-full border bg-muted",
          className,
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border p-1",
        "transition-colors duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDark ? "border-blue-800 bg-blue-950" : "border-zinc-200 bg-zinc-100",
        className,
      )}
    >
      {/* Iconos fijos de la pista (estado inactivo): el del lado opuesto al thumb
          queda visible y atenuado, con cross-fade suave al alternar. */}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
        <Sun
          className={cn(
            "size-4 transition-opacity duration-500 ease-in-out motion-reduce:transition-none",
            isDark ? "text-amber-400/40" : "opacity-0",
          )}
          aria-hidden="true"
        />
        <Moon
          className={cn(
            "size-4 transition-opacity duration-500 ease-in-out motion-reduce:transition-none",
            isDark ? "opacity-0" : "text-blue-500/40",
          )}
          aria-hidden="true"
        />
      </span>

      {/* Thumb deslizante: ámbar+sol (claro) / azul+luna (oscuro). El deslizamiento
          usa un ease tipo "spring" suave; el color cambia en sincronía. */}
      <span
        className={cn(
          "relative z-10 flex size-7 items-center justify-center rounded-full text-white shadow-md",
          "transition-[transform,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none",
          isDark
            ? "translate-x-7 bg-blue-500 shadow-blue-900/40"
            : "translate-x-0 bg-amber-500 shadow-amber-500/30",
        )}
        aria-hidden="true"
      >
        {/* Ambos iconos apilados: cross-fade + leve giro/escala para dar vida. */}
        <Sun
          className={cn(
            "absolute size-4 transition-all duration-500 ease-in-out motion-reduce:transition-none",
            isDark
              ? "rotate-90 scale-50 opacity-0"
              : "rotate-0 scale-100 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute size-4 transition-all duration-500 ease-in-out motion-reduce:transition-none",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-50 opacity-0",
          )}
        />
      </span>
    </button>
  );
}
