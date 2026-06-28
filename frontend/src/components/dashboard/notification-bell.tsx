"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Popover } from "@base-ui/react/popover";
import {
  ArrowRight,
  Bell,
  BellRing,
  Check,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import type { NotificationType } from "@/lib/api/notifications";
import {
  notificationActionFor,
  type NotificationAction,
} from "@/lib/notification-action";
import { formatRelative, metaFor } from "@/lib/notifications-meta";
import { NotificationBody } from "@/components/dashboard/notification-body";
import { NotificationDetailDialog } from "@/components/dashboard/notification-detail-dialog";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Una notificación del panel docente/estudiante. Mapea 1:1 con la fila que
 * entrega `GET /notifications`. Al hacer clic se abre en un modal de detalle
 * (no navega al panel central).
 */
export type DashboardNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** ISO 8601. */
  createdAt: string;
  read: boolean;
  /** Contexto opcional (p. ej. chat: { moduleId, fromUserId }). */
  data?: Record<string, unknown> | null;
};

/**
 * Centro de notificaciones para PROFESSOR / STUDENT. Vive en la barra superior
 * del panel: un botón circular navy con una campana (badge ámbar si hay no
 * leídas) que abre un popover con la lista. Usa **Base UI** `Popover` (no Radix),
 * que portala el popup al `body` para no quedar recortado por contenedores con
 * `overflow`. Mientras no exista el backend, `initialNotifications` por defecto
 * es `[]` y se muestra un estado vacío honesto.
 */
export function NotificationBell({
  initialNotifications = [],
  role,
  token,
}: {
  initialNotifications?: DashboardNotification[];
  /** Rol del usuario (define a dónde lleva el botón "Ir al chat"). */
  role?: string;
  /** Token del backend para autenticar el socket de notificaciones. */
  token?: string;
}) {
  const [notifications, setNotifications] =
    useState<DashboardNotification[]>(initialNotifications);
  const [open, setOpen] = useState(false);
  // Notificación abierta en el modal de detalle (al hacer clic en una fila).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = notifications.find((n) => n.id === selectedId) ?? null;

  // Push en tiempo real por WebSocket (reemplaza el polling): el backend emite
  // `notification:new` a la sala del usuario al crear una notificación. La
  // anteponemos a la lista (deduplicando por id) y el badge se actualiza solo.
  useEffect(() => {
    if (!token) return;
    const socket = io(`${API_URL}/notifications`, {
      auth: { token },
      transports: ["websocket"],
    });
    socket.on("notification:new", (n: DashboardNotification) => {
      setNotifications((prev) =>
        prev.some((x) => x.id === n.id) ? prev : [n, ...prev],
      );
    });
    // El usuario abrió un chat: marca como leídas sus notificaciones de esa
    // conversación (las empareja por `conversationKey`), sin recargar.
    socket.on("notification:read", (p: { conversationKey?: string }) => {
      if (!p?.conversationKey) return;
      setNotifications((prev) =>
        prev.map((n) =>
          !n.read && n.data?.conversationKey === p.conversationKey
            ? { ...n, read: true }
            : n,
        ),
      );
    });
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token]);

  const unreadCount = notifications.reduce(
    (acc, n) => acc + (n.read ? 0 : 1),
    0,
  );
  const hasUnread = unreadCount > 0;

  function markAllRead() {
    if (!hasUnread) return;
    // UI optimista: marca local y persiste en el backend (sin bloquear).
    setNotifications((prev) =>
      prev.map((n) => (n.read ? n : { ...n, read: true })),
    );
    void fetch("/api/notifications/read-all", { method: "PATCH" });
  }

  function markRead(id: string) {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      // Evita un PATCH redundante si ya estaba leída.
      if (target && !target.read) {
        void fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      }
      return prev.map((n) => (n.id === id ? { ...n, read: true } : n));
    });
  }

  // Abre la notificación en el modal de detalle: la marca como leída, cierra el
  // popover y muestra el modal (ambos portalados al body, conviven sin recorte).
  function openDetail(id: string) {
    markRead(id);
    setOpen(false);
    setSelectedId(id);
  }

  return (
    <>
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={
          hasUnread
            ? `Notificaciones (${unreadCount} sin leer)`
            : "Notificaciones"
        }
        className="relative inline-flex size-10 items-center justify-center rounded-full bg-blue-950 text-white shadow-sm transition-colors hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 data-[popup-open]:bg-blue-900"
      >
        {hasUnread ? (
          <BellRing className="size-[1.15rem]" aria-hidden="true" />
        ) : (
          <Bell className="size-[1.15rem]" aria-hidden="true" />
        )}
        {hasUnread && (
          <span
            className="absolute -right-0.5 -top-0.5 flex min-w-[1.1rem] items-center justify-center rounded-full bg-amber-400 px-1 text-[0.65rem] font-bold leading-[1.1rem] text-blue-950 ring-2 ring-card"
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={10}>
          <Popover.Popup className="z-50 w-[min(22rem,calc(100vw-1.5rem))] origin-(--transform-origin) overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xl outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            {/* Encabezado */}
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <Popover.Title className="text-sm font-semibold">
                  Notificaciones
                </Popover.Title>
                <p className="text-xs text-muted-foreground">
                  {hasUnread
                    ? `Tienes ${unreadCount} sin leer`
                    : "Estás al día"}
                </p>
              </div>
              {hasUnread && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-sky-600 transition-colors hover:bg-sky-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 dark:text-sky-300"
                >
                  <Check className="size-3.5" aria-hidden="true" />
                  Marcar leídas
                </button>
              )}
            </div>

            {/* Lista / estado vacío */}
            {notifications.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <ul className="max-h-[24rem] divide-y overflow-y-auto">
                  {notifications.slice(0, 8).map((n) => (
                    <li key={n.id}>
                      <NotificationRow
                        notification={n}
                        onOpen={openDetail}
                        action={notificationActionFor(n.type, n.data, role)}
                        onNavigate={() => {
                          // Ir al chat/actividad también marca la notificación
                          // como leída (optimista + PATCH al backend).
                          markRead(n.id);
                          setOpen(false);
                        }}
                      />
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard/notificaciones"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-1.5 border-t px-4 py-3 text-sm font-medium text-sky-600 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50 dark:text-sky-300"
                >
                  Ver todas las notificaciones
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>

      <NotificationDetailDialog
        notification={selected}
        action={
          selected
            ? notificationActionFor(selected.type, selected.data, role)
            : null
        }
        onNavigate={() => setSelectedId(null)}
        open={selectedId !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
      />
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span
        className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
        aria-hidden="true"
      >
        <Bell className="size-6" />
      </span>
      <p className="text-sm font-medium text-foreground">
        No tienes notificaciones
      </p>
      <p className="max-w-[15rem] text-xs text-muted-foreground">
        Aquí te avisaremos sobre tus cursos, módulos y calificaciones.
      </p>
    </div>
  );
}

function NotificationRow({
  notification,
  onOpen,
  action,
  onNavigate,
}: {
  notification: DashboardNotification;
  onOpen: (id: string) => void;
  /** Botón "ir a…" (chat / actividad) si la notificación lo tiene. */
  action?: NotificationAction | null;
  onNavigate?: () => void;
}) {
  const { id, type, title, body, createdAt, read } = notification;
  const meta = metaFor(type);
  const Icon = meta.icon;
  const ActionIcon = action?.kind === "activity" ? ClipboardList : MessageSquare;

  const content = (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          meta.tint,
        )}
        aria-hidden="true"
      >
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {!read && (
            <span
              className="size-2 shrink-0 rounded-full bg-sky-500"
              aria-label="Sin leer"
            />
          )}
          <p
            className={cn(
              "truncate text-sm",
              read
                ? "font-medium text-foreground"
                : "font-semibold text-foreground",
            )}
          >
            {title}
          </p>
        </div>
        <NotificationBody
          text={body}
          className="mt-0.5 line-clamp-2 text-xs text-muted-foreground"
        />
        <p className="mt-1 text-[0.7rem] text-muted-foreground/80">
          {formatRelative(createdAt)}
        </p>
      </div>
    </div>
  );

  return (
    <div className={cn(!read && "bg-sky-500/[0.05]")}>
      <button
        type="button"
        onClick={() => onOpen(id)}
        className="block w-full px-4 pt-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:bg-muted/60"
      >
        {content}
      </button>
      {/* Botón de acción (ir al chat / a la actividad) fuera del botón de la
          fila para no anidar elementos interactivos. */}
      {action ? (
        <div className="px-4 pb-3 pl-[3.75rem] pt-1.5">
          <Link
            href={action.href}
            onClick={onNavigate}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 dark:text-blue-300"
          >
            <ActionIcon className="size-3.5" aria-hidden="true" />
            {action.label}
          </Link>
        </div>
      ) : (
        <div className="pb-1" />
      )}
    </div>
  );
}
