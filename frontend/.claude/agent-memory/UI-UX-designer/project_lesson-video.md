---
name: lesson-video
description: LessonVideo client component — custom navy poster + click-to-load YouTube/Vimeo iframe, hides external branding until play
metadata:
  type: project
---

`src/components/dashboard/lesson-video.tsx` (client). Props `videoUrl: string|null`, `title`.

Parsea id de YouTube (`watch?v=`, `youtu.be/`, `/embed/`, `/shorts/` → 11 chars) y Vimeo (`vimeo.com/<id>` o `player.vimeo.com/video/<id>`). Antes de reproducir: póster propio 16:9 (`aspect-video rounded-2xl`) con gradiente navy `from-blue-800 via-blue-900 to-blue-950` (dark slate), blobs blur blanco + ámbar, botón circular blanco central con `Play` fill. NO monta el iframe hasta el clic (`playing` state) — performance + oculta branding YouTube.

Embed: YouTube `youtube-nocookie.com/embed/<id>?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&color=white`; Vimeo `player.vimeo.com/video/<id>?autoplay=1&title=0&byline=0&portrait=0`. `allowFullScreen` + `allow="...autoplay..."`.

`videoUrl` null o enlace no reconocido → estado "Esta lección aún no tiene video" (mismo marco navy, icono `VideoOff`). Para videos se usa `<iframe>`, nunca `next/image`.

Relacionado: [[aula-classroom]].
