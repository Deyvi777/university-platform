"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Images,
  Play,
  X,
} from "lucide-react";
import type {
  GalleryItem,
  GalleryMediaType,
} from "@/lib/api/gallery";

type Filter = "ALL" | GalleryMediaType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "IMAGE", label: "Fotografías" },
  { value: "VIDEO", label: "Videos" },
];

function Media({ item, index }: { item: GalleryItem; index: number }) {
  if (item.type === "VIDEO") {
    return (
      <>
        <video
          src={item.url}
          preload="metadata"
          muted
          playsInline
          className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.015]"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/10">
          <span className="flex size-14 items-center justify-center rounded-full border border-white/30 bg-slate-950/65 text-white shadow-xl backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
            <Play className="size-5 fill-current" aria-hidden="true" />
          </span>
        </span>
      </>
    );
  }

  return (
    // Las dimensiones de los archivos administrables son desconocidas; <img>
    // permite que cada pieza del masonry adopte su proporción natural.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.url}
      alt={item.title ?? `Fotografía institucional ${index + 1}`}
      loading={index < 4 ? "eager" : "lazy"}
      className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.015]"
    />
  );
}

/** Galería editorial con filtros y visor inmersivo para fotos y videos. */
export function GalleryCarousel({ items }: { items: GalleryItem[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleItems =
    filter === "ALL" ? items : items.filter((item) => item.type === filter);
  const expandedIndex = expandedId
    ? visibleItems.findIndex((item) => item.id === expandedId)
    : -1;
  const expanded = expandedIndex >= 0 ? visibleItems[expandedIndex] : null;

  const closeViewer = () => setExpandedId(null);
  const showPrevious = () => {
    if (expandedIndex < 0) return;
    const previous =
      (expandedIndex - 1 + visibleItems.length) % visibleItems.length;
    setExpandedId(visibleItems[previous].id);
  };
  const showNext = () => {
    if (expandedIndex < 0) return;
    setExpandedId(visibleItems[(expandedIndex + 1) % visibleItems.length].id);
  };

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  });

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
            <Images className="size-4" aria-hidden="true" />
            Archivo visual
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {visibleItems.length} {visibleItems.length === 1 ? "momento" : "momentos"} para explorar
          </p>
        </div>

        <div
          className="flex w-fit rounded-full border border-white/10 bg-white/[0.04] p-1"
          aria-label="Filtrar galería"
        >
          {FILTERS.map((option) => {
            const count =
              option.value === "ALL"
                ? items.length
                : items.filter((item) => item.type === option.value).length;
            if (option.value !== "ALL" && count === 0) return null;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setFilter(option.value);
                  setExpandedId(null);
                }}
                aria-pressed={filter === option.value}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  filter === option.value
                    ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/15"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {visibleItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setExpandedId(item.id)}
              className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-left shadow-xl shadow-black/10 transition-all duration-500 hover:-translate-y-1 hover:border-amber-300/40 hover:shadow-2xl hover:shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label={item.title ?? `Abrir elemento ${index + 1}`}
            >
              <Media item={item} index={index} />
            </button>
          ))}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-xl sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={expanded.title ?? "Vista ampliada de la galería"}
          onClick={closeViewer}
        >
          <div
            className="flex max-h-full w-full max-w-6xl flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative flex max-h-[78vh] min-h-56 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black/40 shadow-2xl shadow-black/70">
              {expanded.type === "IMAGE" ? (
                // El visor necesita conservar la proporción natural de imágenes desconocidas.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={expanded.url}
                  alt={expanded.title ?? "Fotografía institucional ampliada"}
                  className="max-h-[78vh] max-w-full object-contain"
                />
              ) : (
                <video
                  key={expanded.id}
                  src={expanded.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[78vh] max-w-full"
                />
              )}
            </div>

            <div className="mt-5 flex w-full items-center justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                  {expanded.type === "IMAGE" ? "Fotografía" : "Video"} · {expandedIndex + 1} de {visibleItems.length}
                </p>
                <p className="mt-1 font-heading text-lg font-semibold text-white sm:text-xl">
                  {expanded.title ?? "Nuestra comunidad Certificate"}
                </p>
              </div>
              {visibleItems.length > 1 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={showPrevious}
                    aria-label="Anterior"
                    className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:border-amber-300/50 hover:bg-white/10"
                  >
                    <ChevronLeft className="size-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="Siguiente"
                    className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:border-amber-300/50 hover:bg-white/10"
                  >
                    <ChevronRight className="size-5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={closeViewer}
            aria-label="Cerrar vista ampliada"
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-colors hover:border-white/50 hover:bg-white/10 sm:right-7 sm:top-7"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
