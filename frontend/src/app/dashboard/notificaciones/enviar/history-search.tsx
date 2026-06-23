"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AnnouncementAudience } from "@/lib/api/admin";
import { Input } from "@/components/ui/input";

const BASE = "/dashboard/notificaciones/enviar";

/**
 * Búsqueda por texto del historial. Actualiza la URL al enviar (Enter/botón),
 * preservando el filtro de audiencia y reiniciando a la página 1. No usa
 * `useSearchParams` (recibe el valor actual por prop), así evita el requisito de
 * `<Suspense>` de Next 16.
 */
export function HistorySearch({
  audience,
  defaultQuery,
}: {
  audience?: AnnouncementAudience;
  defaultQuery: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultQuery);

  function navigate(q: string) {
    const sp = new URLSearchParams();
    if (audience) sp.set("aud", audience);
    if (q.trim()) sp.set("q", q.trim());
    const qs = sp.toString();
    router.push(qs ? `${BASE}?${qs}` : BASE, { scroll: false });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate(value);
      }}
      role="search"
      className="relative"
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar en avisos enviados…"
        aria-label="Buscar en el historial"
        className="pl-9 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            navigate("");
          }}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
