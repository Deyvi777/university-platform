"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotificationBody } from "@/components/dashboard/notification-body";
import type { NotificationType } from "@/lib/api/notifications";
import { formatFull, metaFor } from "@/lib/notifications-meta";
import { cn } from "@/lib/utils";

/** Datos mínimos para mostrar una notificación en el modal de detalle. */
export type DetailNotification = {
  type: NotificationType;
  title: string;
  body: string;
  /** ISO 8601. */
  createdAt: string;
};

/**
 * Modal con el detalle de una notificación. Compartido por la bandeja
 * (`NotificationsInbox`) y el campanario del topbar (`NotificationBell`), para
 * que al hacer clic en una notificación se abra aquí y no en el panel central.
 */
export function NotificationDetailDialog({
  notification,
  open,
  onOpenChange,
}: {
  notification: DetailNotification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const meta = notification ? metaFor(notification.type) : null;
  const Icon = meta?.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        {notification && meta && Icon && (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4">
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
                  <DialogTitle className="mt-2 font-heading text-xl leading-tight font-bold tracking-tight">
                    {notification.title}
                  </DialogTitle>
                  <time className="mt-1 block text-sm text-muted-foreground">
                    {formatFull(notification.createdAt)}
                  </time>
                </div>
              </div>
            </DialogHeader>
            <NotificationBody
              text={notification.body}
              className="text-base leading-relaxed text-foreground/90"
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
