"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

type ParsedVideo =
  | { provider: "youtube"; id: string }
  | { provider: "vimeo"; id: string }
  | null;

/** Extrae el id de un enlace de YouTube o Vimeo. `null` si no lo reconoce. */
function parseVideo(url: string): ParsedVideo {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const yt =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(
      trimmed,
    );
  if (yt?.[1]) return { provider: "youtube", id: yt[1] };

  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(trimmed);
  if (vimeo?.[1]) return { provider: "vimeo", id: vimeo[1] };

  return null;
}

function embedSrc(video: NonNullable<ParsedVideo>): string {
  if (video.provider === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&color=white`;
  }
  return `https://player.vimeo.com/video/${video.id}?autoplay=1&title=0&byline=0&portrait=0`;
}

/**
 * Botón "Ver video del programa" + modal con el reproductor. Soporta enlaces de
 * YouTube/Vimeo (iframe) y archivos subidos (`/files/...`, etiqueta `<video>`).
 * El componente padre solo lo renderiza cuando el programa tiene `videoUrl`.
 */
export function ProgramVideoModal({
  videoUrl,
  title,
}: {
  videoUrl: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const embedded = parseVideo(videoUrl);

  // Cierra con Escape y bloquea el scroll del fondo mientras el modal está abierto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/10"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-amber-400 text-slate-950">
          <Play className="size-3.5 translate-x-px fill-current" />
        </span>
        Ver video
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Video de ${title}`}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar video"
              className="absolute -top-11 right-0 flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="size-5" />
            </button>

            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
              {embedded ? (
                <iframe
                  src={embedSrc(embedded)}
                  title={title}
                  className="size-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="size-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
