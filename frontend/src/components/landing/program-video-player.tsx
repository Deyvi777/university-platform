import { Play } from "lucide-react";

type ParsedVideo =
  | { provider: "youtube"; id: string }
  | { provider: "vimeo"; id: string }
  | null;

/** Extrae el id de un enlace de YouTube o Vimeo. `null` si no lo reconoce. */
function parseVideo(url: string): ParsedVideo {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const youtube =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(
      trimmed,
    );
  if (youtube?.[1]) return { provider: "youtube", id: youtube[1] };

  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(trimmed);
  if (vimeo?.[1]) return { provider: "vimeo", id: vimeo[1] };

  return null;
}

function embedSrc(video: NonNullable<ParsedVideo>): string {
  if (video.provider === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${video.id}?modestbranding=1&rel=0&iv_load_policy=3&color=white`;
  }
  return `https://player.vimeo.com/video/${video.id}?title=0&byline=0&portrait=0`;
}

/** Reproductor promocional integrado bajo el flyer del programa. */
export function ProgramVideoPlayer({
  videoUrl,
  title,
  position = 1,
  total = 1,
}: {
  videoUrl: string;
  title: string;
  position?: number;
  total?: number;
}) {
  const embedded = parseVideo(videoUrl);
  const headingId = `program-video-title-${position}`;
  const visibleTitle = total > 1 ? `Video ${position} del programa` : "Video del programa";
  const accessibleTitle = `Video ${position} de ${title}`;

  return (
    <section className="mt-5" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"
      >
        <span
          className="flex size-7 items-center justify-center rounded-full bg-amber-400 text-slate-950"
          aria-hidden="true"
        >
          <Play className="size-3.5 translate-x-px fill-current" />
        </span>
        {visibleTitle}
      </h2>

      <div className="aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-xl shadow-black/20">
        {embedded ? (
          <iframe
            src={embedSrc(embedded)}
            title={accessibleTitle}
            className="size-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            aria-label={accessibleTitle}
            className="size-full"
          />
        )}
      </div>
    </section>
  );
}
