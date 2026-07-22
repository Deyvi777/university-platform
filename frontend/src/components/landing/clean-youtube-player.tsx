"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type YoutubePlayer = {
  destroy: () => void;
  mute: () => void;
  playVideo: () => void;
  setVolume: (volume: number) => void;
  unMute: () => void;
};

type YoutubeApi = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      host: string;
      playerVars: Record<string, number | string>;
      events: {
        onReady: (event: { target: YoutubePlayer }) => void;
      };
    },
  ) => YoutubePlayer;
};

declare global {
  interface Window {
    YT?: YoutubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YoutubeApi> | null = null;

function loadYoutubeApi(): Promise<YoutubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT) resolve(window.YT);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

export function CleanYoutubePlayer({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YoutubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void loadYoutubeApi().then((api) => {
      if (cancelled || !mountRef.current) return;

      playerRef.current = new api.Player(mountRef.current, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          loop: 1,
          mute: 0,
          playlist: videoId,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: ({ target }) => {
            target.setVolume(100);
            target.unMute();
            target.playVideo();
            setIsReady(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  function toggleVolume() {
    const player = playerRef.current;
    if (!player) return;

    if (isMuted) {
      player.setVolume(100);
      player.unMute();
      player.playVideo();
    } else {
      player.mute();
    }
    setIsMuted(!isMuted);
  }

  return (
    <div className="relative aspect-[9/16]" aria-label={title}>
      <div ref={mountRef} className="size-full" />
      <button
        type="button"
        onClick={toggleVolume}
        disabled={!isReady}
        aria-label={isMuted ? "Activar audio" : "Silenciar video"}
        aria-pressed={!isMuted}
        className="absolute bottom-4 right-4 z-10 flex size-11 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-white shadow-lg backdrop-blur-sm transition-all hover:border-amber-300/60 hover:bg-amber-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-wait disabled:opacity-50"
      >
        {isMuted ? (
          <VolumeX className="size-5" aria-hidden="true" />
        ) : (
          <Volume2 className="size-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
