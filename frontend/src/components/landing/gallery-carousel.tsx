"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import type { GalleryItem } from "@/lib/api/gallery";

/** Cada cuántos ms avanza solo el carrusel (pausado con el visor abierto). */
const AUTOPLAY_MS = 3500;
/** Cuántas tarjetas se ven a cada lado de la central. */
const SIDE_CARDS = 3;

/**
 * Distancia circular con signo entre una tarjeta y la activa (camino más
 * corto), para que el carrusel "dé la vuelta" sin saltos en los extremos.
 */
function circularOffset(index: number, active: number, total: number): number {
  let off = (index - active) % total;
  if (off > total / 2) off -= total;
  if (off < -total / 2) off += total;
  return off;
}

/**
 * Carrusel 3D tipo coverflow de la página Galería: la tarjeta central al
 * frente y las laterales escalonadas en profundidad. Gira solo cada
 * `AUTOPLAY_MS`; al hacer clic en una tarjeta se abre ampliada en un visor
 * (pausando el giro) y el botón de cierre lo reanuda.
 */
export function GalleryCarousel({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  const total = items.length;
  const expanded = expandedId
    ? (items.find((i) => i.id === expandedId) ?? null)
    : null;

  // Giro automático: pausado con el visor abierto, con el puntero encima o si
  // el usuario prefiere menos movimiento.
  useEffect(() => {
    if (total < 2 || expandedId !== null || hovered) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      setActive((a) => (a + 1) % total);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [total, expandedId, hovered]);

  // Visor abierto: Escape lo cierra y se bloquea el scroll del fondo.
  useEffect(() => {
    if (expandedId === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [expandedId]);

  if (total === 0) return null;

  const goPrev = () => setActive((a) => (a - 1 + total) % total);
  const goNext = () => setActive((a) => (a + 1) % total);

  return (
    <div>
      <div
        className="relative h-[500px] sm:h-[620px] lg:h-[720px] [perspective:2000px]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {items.map((item, index) => {
          const offset = circularOffset(index, active, total);
          const abs = Math.abs(offset);
          const hidden = abs > SIDE_CARDS;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActive(index);
                setExpandedId(item.id);
              }}
              aria-label={
                item.title ??
                `Ver ${item.type === "IMAGE" ? "foto" : "video"} ${index + 1} en grande`
              }
              tabIndex={hidden ? -1 : 0}
              className="absolute left-1/2 top-1/2 h-[380px] w-[22rem] overflow-hidden rounded-2xl border-2 border-white/20 bg-slate-950 shadow-2xl shadow-black/60 transition-all duration-700 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 motion-reduce:transition-none sm:h-[480px] sm:w-[30rem] lg:h-[560px] lg:w-[38rem]"
              style={{
                transform: `translateX(${-50 + offset * 62}%) translateY(-50%) rotateY(${offset * -8}deg) scale(${1 - abs * 0.09})`,
                zIndex: 20 - abs,
                opacity: hidden ? 0 : 1,
                pointerEvents: hidden ? "none" : "auto",
                filter: `brightness(${1 - abs * 0.22})`,
              }}
            >
              {item.type === "IMAGE" ? (
                <Image
                  src={item.url}
                  alt={item.title ?? `Foto ${index + 1} de la galería`}
                  fill
                  sizes="(min-width: 1024px) 608px, (min-width: 640px) 480px, 352px"
                  className="object-contain p-1"
                />
              ) : (
                <>
                  <video
                    src={item.url}
                    preload="metadata"
                    muted
                    playsInline
                    className="size-full object-contain"
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="flex size-14 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-sm">
                      <Play className="size-6 fill-current" aria-hidden="true" />
                    </span>
                  </span>
                </>
              )}
              {item.title && offset === 0 && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent px-4 pb-3 pt-10 text-left text-sm font-medium text-white">
                  {item.title}
                </span>
              )}
            </button>
          );
        })}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Anterior"
              className="absolute left-2 top-1/2 z-30 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 text-white backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-slate-950/90 sm:left-6"
            >
              <ChevronLeft className="size-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Siguiente"
              className="absolute right-2 top-1/2 z-30 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 text-white backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-slate-950/90 sm:right-6"
            >
              <ChevronRight className="size-6" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Ir al elemento ${index + 1}`}
              aria-current={index === active}
              className={`size-2.5 rounded-full transition-all duration-300 ${
                index === active
                  ? "scale-125 bg-amber-400"
                  : "bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}

      {expanded && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/95 p-4 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={expanded.title ?? "Vista ampliada de la galería"}
          onClick={() => setExpandedId(null)}
        >
          <div
            className="flex max-h-full w-full max-w-5xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full overflow-hidden rounded-2xl border border-white/15 shadow-2xl shadow-black/60">
              {expanded.type === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={expanded.url}
                  alt={expanded.title ?? "Foto de la galería"}
                  className="max-h-[75vh] w-full object-contain"
                />
              ) : (
                <video
                  src={expanded.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[75vh] w-full"
                />
              )}
            </div>

            {expanded.title && (
              <p className="mt-4 text-center text-base text-slate-200">
                {expanded.title}
              </p>
            )}

            <button
              type="button"
              onClick={() => setExpandedId(null)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-400/20 transition-colors hover:bg-amber-300"
            >
              <X className="size-4" aria-hidden="true" />
              Volver al carrusel
            </button>
          </div>

          <button
            type="button"
            onClick={() => setExpandedId(null)}
            aria-label="Cerrar vista ampliada"
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-colors hover:border-white/60 hover:bg-white/10 sm:right-6 sm:top-6"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
