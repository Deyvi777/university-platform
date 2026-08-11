"use client";

import { ExternalLink, Play } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type TutorialVideo = {
  id: string;
  title: string;
  description: string;
};

export function TutorialVideoGrid({
  tutorials,
}: {
  tutorials: readonly TutorialVideo[];
}) {
  const [selected, setSelected] = useState<TutorialVideo | null>(null);
  const [mobilePlayback, setMobilePlayback] = useState(false);
  const fullscreenRequestRef = useRef<Promise<void> | null>(null);

  function playTutorial(tutorial: TutorialVideo) {
    const isPhoneInLandscape =
      navigator.maxTouchPoints > 0 &&
      Math.min(window.screen.width, window.screen.height) < 768;
    const isMobile =
      window.matchMedia("(max-width: 767px)").matches || isPhoneInLandscape;

    setMobilePlayback(isMobile);
    setSelected(tutorial);

    if (
      !isMobile ||
      !document.fullscreenEnabled ||
      document.fullscreenElement
    ) {
      return;
    }

    const request = document.documentElement.requestFullscreen({
      navigationUI: "hide",
    });
    fullscreenRequestRef.current = request;

    void request.catch(() => {
      // Safari/iOS puede rechazar la API; el diálogo de borde a borde queda
      // como respaldo visual sin interrumpir la reproducción.
      if (fullscreenRequestRef.current === request) {
        fullscreenRequestRef.current = null;
      }
    });
  }

  function closePlayer() {
    const fullscreenRequest = fullscreenRequestRef.current;
    fullscreenRequestRef.current = null;
    setSelected(null);
    setMobilePlayback(false);

    if (!fullscreenRequest) return;

    void fullscreenRequest
      .catch(() => undefined)
      .then(() => {
        if (document.fullscreenElement) {
          return document.exitFullscreen();
        }
      })
      .catch(() => undefined);
  }

  return (
    <>
      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {tutorials.map((tutorial, index) => {
          const youtubeUrl = `https://www.youtube.com/watch?v=${tutorial.id}`;

          return (
            <article
              key={tutorial.id}
              className="group flex min-w-0 flex-col rounded-3xl border bg-card p-3 shadow-sm shadow-blue-950/[0.04] transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md motion-reduce:transition-none dark:shadow-none sm:p-4"
            >
              <button
                type="button"
                onClick={() => playTutorial(tutorial)}
                aria-label={`Reproducir ${tutorial.title} en pantalla grande`}
                className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 text-white shadow-md shadow-blue-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-card dark:from-slate-800 dark:via-slate-900 dark:to-slate-950"
              >
                <span
                  className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-white/[0.07] blur-3xl"
                  aria-hidden="true"
                />
                <span
                  className="pointer-events-none absolute -bottom-12 -left-10 size-44 rounded-full bg-amber-300/[0.09] blur-3xl"
                  aria-hidden="true"
                />
                <span className="absolute left-4 top-4 rounded-full bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/15 backdrop-blur-sm">
                  Tutorial {index + 1}
                </span>
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
                  <span
                    className="flex size-16 items-center justify-center rounded-full bg-white text-blue-950 shadow-lg shadow-blue-950/30 transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none sm:size-18"
                    aria-hidden="true"
                  >
                    <Play className="size-7 translate-x-0.5 fill-current sm:size-8" />
                  </span>
                  <span className="text-sm font-semibold text-white/90">
                    Reproducir en pantalla grande
                  </span>
                </span>
              </button>

              <div className="flex flex-1 flex-col px-1 pb-1 pt-4 sm:px-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                    Video {index + 1} de {tutorials.length}
                  </span>
                  <Link
                    href={youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Abrir ${tutorial.title} en YouTube`}
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </Link>
                </div>
                <h3 className="mt-3 font-heading text-lg font-bold tracking-tight text-foreground">
                  {tutorial.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {tutorial.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) closePlayer();
        }}
      >
        <DialogContent
          className={cn(
            "gap-0 p-0",
            mobilePlayback
              ? "flex h-svh w-screen max-h-svh max-w-none flex-col overflow-hidden rounded-none bg-black [&_[data-slot=dialog-close]]:bg-black/50 [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:opacity-100"
              : "max-h-[calc(100svh-1rem)] max-w-6xl overflow-y-auto sm:w-[calc(100%-3rem)]",
          )}
        >
          {selected && (
            <>
              <DialogHeader
                className={cn(
                  "px-5 pb-4 pr-14 pt-5 sm:px-6 sm:pb-5 sm:pr-16 sm:pt-6",
                  mobilePlayback && "sr-only",
                )}
              >
                <DialogTitle className="text-lg leading-snug sm:text-xl">
                  {selected.title}
                </DialogTitle>
                <DialogDescription className="max-w-4xl leading-6">
                  {selected.description}
                </DialogDescription>
              </DialogHeader>

              <div
                className={cn(
                  "w-full overflow-hidden bg-black",
                  mobilePlayback ? "min-h-0 flex-1" : "aspect-video",
                )}
              >
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${selected.id}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&color=white`}
                  title={selected.title}
                  className="size-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <div
                className={cn(
                  "flex justify-end px-5 py-4 sm:px-6",
                  mobilePlayback && "hidden",
                )}
              >
                <Link
                  href={`https://www.youtube.com/watch?v=${selected.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  Abrir en YouTube
                  <ExternalLink className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
