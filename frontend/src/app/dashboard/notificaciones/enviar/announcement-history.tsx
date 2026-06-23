import { ChevronLeft, ChevronRight, Megaphone, Users } from "lucide-react";
import Link from "next/link";
import type {
  AdminAnnouncementPage,
  AnnouncementAudience,
} from "@/lib/api/admin";
import { NotificationBody } from "@/components/dashboard/notification-body";
import { formatRelative } from "@/lib/notifications-meta";
import { cn } from "@/lib/utils";
import { HistorySearch } from "./history-search";

const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  ALL: "A todos",
  PROFESSORS: "Docentes",
  STUDENTS: "Estudiantes",
  SELECTED: "Selección",
};

// Chips de filtro por audiencia. `undefined` = sin filtro ("Todas").
const FILTERS: { label: string; value?: AnnouncementAudience }[] = [
  { label: "Todas", value: undefined },
  { label: "A todos", value: "ALL" },
  { label: "Docentes", value: "PROFESSORS" },
  { label: "Estudiantes", value: "STUDENTS" },
  { label: "Selección", value: "SELECTED" },
];

const BASE = "/dashboard/notificaciones/enviar";

function hrefWith(params: {
  audience?: AnnouncementAudience;
  q?: string;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (params.audience) sp.set("aud", params.audience);
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

/**
 * Historial de avisos enviados (server component): filtros por audiencia +
 * búsqueda por texto + paginación, todo manejado por la URL para mantenerlo
 * server-rendered y compartible.
 */
export function AnnouncementHistory({
  page,
  audience,
  q,
}: {
  page: AdminAnnouncementPage;
  audience?: AnnouncementAudience;
  q: string;
}) {
  const { items, total, totalPages } = page;
  const current = page.page;
  const hasFilters = Boolean(audience) || Boolean(q.trim());

  return (
    <section aria-labelledby="historial">
      <h2 id="historial" className="font-heading text-lg font-semibold">
        Avisos enviados
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Lo que ya se envió al centro de notificaciones de docentes y
        estudiantes.
      </p>

      {/* Filtros por audiencia */}
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (f.value ?? undefined) === (audience ?? undefined);
          return (
            <Link
              key={f.label}
              href={hrefWith({ audience: f.value, q })}
              scroll={false}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50",
                active
                  ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Búsqueda */}
      <div className="mt-3">
        <HistorySearch audience={audience} defaultQuery={q} />
      </div>

      {items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
          <span
            className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <Megaphone className="size-6" />
          </span>
          <p className="text-sm font-medium text-foreground">
            {hasFilters
              ? "Sin resultados"
              : "Aún no has enviado avisos"}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {hasFilters ? (
              <>
                No hay avisos que coincidan con el filtro.{" "}
                <Link
                  href={BASE}
                  scroll={false}
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Quitar filtros
                </Link>
              </>
            ) : (
              "Cuando envíes uno, aparecerá aquí con su detalle."
            )}
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            {items.map((a) => (
              <li
                key={a.id}
                className="rounded-2xl border bg-card p-5 shadow-sm shadow-blue-950/[0.04] dark:shadow-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 font-heading text-base font-semibold leading-tight">
                    {a.title}
                  </h3>
                  <time className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                    {formatRelative(a.createdAt)}
                  </time>
                </div>

                <NotificationBody
                  text={a.body}
                  className="mt-1.5 line-clamp-2 text-sm text-muted-foreground"
                />

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                    {AUDIENCE_LABEL[a.audience]}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" aria-hidden="true" />
                    {a.recipientCount}{" "}
                    {a.recipientCount === 1 ? "destinatario" : "destinatarios"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {a.sender.firstName} {a.sender.lastName}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* Paginación */}
          {totalPages > 1 && (
            <nav
              className="mt-5 flex items-center justify-between gap-3"
              aria-label="Paginación del historial"
            >
              <PageLink
                href={hrefWith({ audience, q, page: current - 1 })}
                disabled={current <= 1}
                direction="prev"
              />
              <span className="text-xs text-muted-foreground">
                Página {current} de {totalPages} · {total}{" "}
                {total === 1 ? "aviso" : "avisos"}
              </span>
              <PageLink
                href={hrefWith({ audience, q, page: current + 1 })}
                disabled={current >= totalPages}
                direction="next"
              />
            </nav>
          )}
        </>
      )}
    </section>
  );
}

function PageLink({
  href,
  disabled,
  direction,
}: {
  href: string;
  disabled: boolean;
  direction: "prev" | "next";
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const label = direction === "prev" ? "Anteriores" : "Siguientes";
  const className = cn(
    "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
    disabled
      ? "pointer-events-none opacity-40"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );

  const content =
    direction === "prev" ? (
      <>
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </>
    ) : (
      <>
        {label}
        <Icon className="size-4" aria-hidden="true" />
      </>
    );

  if (disabled) {
    return (
      <span className={className} aria-disabled="true">
        {content}
      </span>
    );
  }
  return (
    <Link href={href} scroll={false} className={className}>
      {content}
    </Link>
  );
}
