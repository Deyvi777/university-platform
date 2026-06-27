"use client";

import { CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { ApiNotification } from "@/lib/api/notifications";
import { formatRelative, metaFor } from "@/lib/notifications-meta";
import { NotificationBody } from "@/components/dashboard/notification-body";
import { NotificationDetailDialog } from "@/components/dashboard/notification-detail-dialog";
import { cn } from "@/lib/utils";

/**
 * Bandeja de notificaciones del panel docente/estudiante. Al hacer clic en una
 * notificación, esta se abre en un **modal** (no en el panel central) y se marca
 * como leída (optimista + PATCH al backend, igual que el campanario). El estado
 * de leídas se gestiona en el cliente para refrescar el contador sin recargar.
 */
export function NotificationsInbox({
  initialNotifications,
  initialOpenId,
}: {
  initialNotifications: ApiNotification[];
  /** Notificación a abrir directamente (al venir del campanario: `?open=`). */
  initialOpenId?: string;
}) {
  // Si llega `initialOpenId` válido, marcamos esa notificación como leída ya en
  // el estado inicial (su PATCH al backend se dispara una vez, abajo).
  const presetId = initialNotifications.some((n) => n.id === initialOpenId)
    ? (initialOpenId ?? null)
    : null;
  const [notifications, setNotifications] = useState(() =>
    presetId
      ? initialNotifications.map((n) =>
          n.id === presetId ? { ...n, read: true } : n,
        )
      : initialNotifications,
  );
  const [openId, setOpenId] = useState<string | null>(presetId);

  // Persistir la lectura de la notificación abierta desde el campanario. Sin
  // setState (la lista ya nace marcada); solo el fire-and-forget al backend.
  useEffect(() => {
    if (presetId) {
      void fetch(`/api/notifications/${presetId}/read`, { method: "PATCH" });
    }
    // Solo al montar, para la notificación preabierta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifications.reduce(
    (acc, n) => acc + (n.read ? 0 : 1),
    0,
  );
  const selected = notifications.find((n) => n.id === openId) ?? null;

  function markRead(id: string) {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.read) {
        void fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      }
      return prev.map((n) => (n.id === id ? { ...n, read: true } : n));
    });
  }

  function markAllRead() {
    if (unreadCount === 0) return;
    setNotifications((prev) =>
      prev.map((n) => (n.read ? n : { ...n, read: true })),
    );
    void fetch("/api/notifications/read-all", { method: "PATCH" });
  }

  function open(id: string) {
    markRead(id);
    setOpenId(id);
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Notificaciones
          </h1>
          <p className="mt-2 text-muted-foreground">
            {unreadCount > 0 ? `Tienes ${unreadCount} sin leer` : "Estás al día"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            Marcar todas como leídas
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <EmptyInbox />
      ) : (
        <ul className="mt-6 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
          {notifications.map((n) => {
            const meta = metaFor(n.type);
            const Icon = meta.icon;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => open(n.id)}
                  className={cn(
                    "flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none sm:px-5",
                    !n.read && "bg-sky-500/[0.05]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      meta.tint,
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <span
                          className="size-2 shrink-0 rounded-full bg-sky-500"
                          aria-label="Sin leer"
                        />
                      )}
                      <p
                        className={cn(
                          "truncate text-sm",
                          n.read
                            ? "font-medium text-foreground"
                            : "font-semibold text-foreground",
                        )}
                      >
                        {n.title}
                      </p>
                    </div>
                    <NotificationBody
                      text={n.body}
                      className="mt-0.5 line-clamp-1 text-sm text-muted-foreground"
                    />
                  </div>

                  <time className="shrink-0 whitespace-nowrap pt-0.5 text-xs text-muted-foreground">
                    {formatRelative(n.createdAt)}
                  </time>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Detalle en modal */}
      <NotificationDetailDialog
        notification={selected}
        open={openId !== null}
        onOpenChange={(o) => {
          if (!o) setOpenId(null);
        }}
      />
    </div>
  );
}

function EmptyInbox() {
  const { icon: Icon } = metaFor("ENROLLMENT");
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted/20 px-6 py-16 text-center">
      <span
        className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
        aria-hidden="true"
      >
        <Icon className="size-7" />
      </span>
      <p className="text-base font-medium text-foreground">
        No tienes notificaciones
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Aquí aparecerán los avisos sobre tus programas, módulos y calificaciones.
      </p>
    </div>
  );
}
