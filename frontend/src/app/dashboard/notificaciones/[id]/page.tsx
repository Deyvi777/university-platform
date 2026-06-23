import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { openNotification } from "@/lib/api/notifications";
import { formatFull, metaFor } from "@/lib/notifications-meta";
import { NotificationBody } from "@/components/dashboard/notification-body";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Notificación",
};

export default async function NotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  // Abrir la notificación la marca como leída (backend, estilo Gmail).
  const notification = await openNotification(id);
  if (!notification) {
    notFound();
  }

  const meta = metaFor(notification.type);
  const Icon = meta.icon;

  return (
    <div className="w-full">
      <Link
        href="/dashboard/notificaciones"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a notificaciones
      </Link>

      <article className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Cabecera con icono + tipo + fecha */}
        <header className="flex items-start gap-4 border-b px-6 py-6 sm:px-8">
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl",
              meta.tint,
            )}
            aria-hidden="true"
          >
            <Icon className="size-6" />
          </span>
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {meta.label}
            </span>
            <h1 className="mt-2 font-heading text-2xl font-bold leading-tight tracking-tight">
              {notification.title}
            </h1>
            <time className="mt-1 block text-sm text-muted-foreground">
              {formatFull(notification.createdAt)}
            </time>
          </div>
        </header>

        {/* Cuerpo */}
        <div className="px-6 py-6 sm:px-8">
          <NotificationBody
            text={notification.body}
            className="text-base leading-relaxed text-foreground/90"
          />
        </div>
      </article>
    </div>
  );
}
