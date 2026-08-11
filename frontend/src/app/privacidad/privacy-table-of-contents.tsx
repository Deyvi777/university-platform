"use client";

import { useEffect, useRef, useState } from "react";

const CONTENTS = [
  ["identificacion-del-responsable", "1. Identificación del responsable"],
  ["datos-que-recopilamos", "2. Datos que recopilamos"],
  ["finalidad-del-tratamiento", "3. Finalidad del tratamiento"],
  ["tratamiento-sistema-virtual", "4. Tratamiento en el sistema virtual"],
  ["confidencialidad-y-seguridad", "5. Confidencialidad y seguridad"],
  ["comunicacion-de-datos", "6. Comunicación de datos"],
  ["conservacion-de-los-datos", "7. Conservación de los datos"],
  ["derechos-del-titular", "8. Derechos del titular"],
  ["responsabilidad-del-usuario", "9. Responsabilidad del usuario"],
  ["cookies", "10. Cookies"],
  ["actualizaciones", "11. Actualizaciones"],
  ["legislacion-aplicable", "12. Legislación aplicable"],
  ["aceptacion", "14. Aceptación"],
] as const;

type ContentId = (typeof CONTENTS)[number][0];

export function PrivacyTableOfContents({ className }: { className?: string }) {
  const [activeId, setActiveId] = useState<ContentId>(CONTENTS[0][0]);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const updateActiveSection = () => {
      frameRef.current = null;

      const marker = Math.min(window.innerHeight * 0.28, 220);
      let currentId: ContentId = CONTENTS[0][0];

      for (const [id] of CONTENTS) {
        const section = document.getElementById(id);

        if (section && section.getBoundingClientRect().top <= marker) {
          currentId = id;
        } else {
          break;
        }
      }

      const reachedBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;

      setActiveId(reachedBottom ? CONTENTS.at(-1)![0] : currentId);
    };

    const scheduleUpdate = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(updateActiveSection);
      }
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    frameRef.current = window.requestAnimationFrame(updateActiveSection);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <ol className={className}>
      {CONTENTS.map(([id, label]) => {
        const isActive = activeId === id;

        return (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={isActive ? "location" : undefined}
              onClick={() => setActiveId(id)}
              className={`relative flex items-center gap-2 overflow-hidden rounded-xl border px-3 py-2 text-xs leading-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 ${
                isActive
                  ? "border-amber-200/30 bg-amber-200/15 font-semibold text-amber-100 shadow-sm shadow-amber-950/20"
                  : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-slate-200"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-5 w-0.5 shrink-0 rounded-full transition-colors ${
                  isActive ? "bg-amber-200" : "bg-transparent"
                }`}
              />
              <span>{label}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
