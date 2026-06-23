"use client";

import { useState } from "react";
import { Play, VideoOff } from "lucide-react";

type ParsedVideo =
  | { provider: "youtube"; id: string }
  | { provider: "vimeo"; id: string }
  | null;

/** Extrae el id de un enlace de YouTube o Vimeo. `null` si no reconoce el formato. */
function parseVideo(url: string): ParsedVideo {
  const trimmed = url.trim();
  if (!trimmed) return null;

  // YouTube: watch?v=, youtu.be/, /embed/, /shorts/
  const yt =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(
      trimmed,
    );
  if (yt?.[1]) return { provider: "youtube", id: yt[1] };

  // Vimeo: vimeo.com/<id> (incluye player.vimeo.com/video/<id>)
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
 * Reproductor de la lección con skin propio de la plataforma. Antes de
 * reproducir muestra un póster navy con el título y un botón de play; el iframe
 * (YouTube/Vimeo) solo se monta tras el clic — mejora performance y oculta el
 * branding externo hasta interactuar.
 */
export function LessonVideo({
  videoUrl,
  title,
}: {
  videoUrl: string | null;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const video = videoUrl ? parseVideo(videoUrl) : null;

  // Sin video o enlace no reconocido → estado vacío elegante.
  if (!videoUrl || !video) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-900 to-blue-950 shadow-sm shadow-blue-950/10 dark:from-slate-900 dark:to-slate-950">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span
            className="flex size-14 items-center justify-center rounded-full bg-white/10 text-white/70 ring-1 ring-white/15"
            aria-hidden="true"
          >
            <VideoOff className="size-7" />
          </span>
          <p className="text-sm font-medium text-white/90">
            Esta lección aún no tiene video
          </p>
          <p className="max-w-xs text-xs text-white/60">
            Revisa los recursos y las actividades de la clase más abajo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-blue-950 shadow-md shadow-blue-950/20 dark:bg-slate-950">
      {playing ? (
        <iframe
          src={embedSrc(video)}
          title={title}
          className="absolute inset-0 size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Reproducir: ${title}`}
          className="group absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-300/60 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950"
        >
          <span
            className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-white/[0.06] blur-3xl"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute -bottom-12 -left-10 size-44 rounded-full bg-amber-300/[0.08] blur-3xl"
            aria-hidden="true"
          />
          <span
            className="relative flex size-16 items-center justify-center rounded-full bg-white text-blue-950 shadow-lg shadow-blue-950/30 transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none sm:size-20"
            aria-hidden="true"
          >
            <Play className="size-7 translate-x-0.5 fill-current sm:size-9" />
          </span>
          <span className="relative max-w-md px-6 text-center text-sm font-medium text-white/90 sm:text-base">
            {title}
          </span>
        </button>
      )}
    </div>
  );
}
