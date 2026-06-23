import { CheckCheck } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { listNotifications } from "@/lib/api/notifications";
import { formatRelative, metaFor } from "@/lib/notifications-meta";
import { NotificationBody } from "@/components/dashboard/notification-body";
import { cn } from "@/lib/utils";
import { markAllReadAction } from "./actions";

export const metadata = {
  title: "Notificaciones",
};

export default async function NotificationsInboxPage() {
  await requireUser();
  const notifications = await listNotifications();
  const unreadCount = notifications.reduce(
    (acc, n) => acc + (n.read ? 0 : 1),
    0,
  );

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Notificaciones
          </h1>
          <p className="mt-2 text-muted-foreground">
            {unreadCount > 0
              ? `Tienes ${unreadCount} sin leer`
              : "Estás al día"}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllReadAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
            >
              <CheckCheck className="size-4" aria-hidden="true" />
              Marcar todas como leídas
            </button>
          </form>
        )}
      </header>

      {notifications.length === 0 ? (
        <EmptyInbox />
      ) : (
        <ul className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm divide-y">
          {notifications.map((n) => {
            const meta = metaFor(n.type);
            const Icon = meta.icon;
            return (
              <li key={n.id}>
                <Link
                  href={`/dashboard/notificaciones/${n.id}`}
                  className={cn(
                    "flex items-start gap-4 px-4 py-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50 sm:px-5",
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
                </Link>
              </li>
            );
          })}
        </ul>
      )}
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
