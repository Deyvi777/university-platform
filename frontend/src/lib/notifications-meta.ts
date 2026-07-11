import {
  Mail,
  MailX,
  MessageSquare,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { NotificationType } from "@/lib/api/notifications";

/**
 * Presentación por tipo de notificación: icono Lucide + etiqueta corta + clases
 * de tinte (badge claro/oscuro). Las notificaciones se muestran como correo
 * (sobre `Mail`); el tinte —celeste/violeta— distingue el tipo. Compartido por
 * la bandeja, el detalle y el campanario.
 */
export const NOTIFICATION_META: Record<
  NotificationType,
  { icon: LucideIcon; label: string; tint: string }
> = {
  ENROLLMENT: {
    icon: Mail,
    label: "Inscripción",
    tint: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
  MODULE_ASSIGNMENT: {
    icon: Mail,
    label: "Asignación de módulo",
    tint: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  },
  ANNOUNCEMENT: {
    icon: Mail,
    label: "Aviso",
    tint: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  GRADE: {
    icon: Mail,
    label: "Calificación",
    tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  ACTIVITY_PUBLISHED: {
    icon: Mail,
    label: "Nueva actividad",
    tint: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  },
  MESSAGE: {
    icon: MessageSquare,
    label: "Mensaje",
    tint: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  // Solo la ve el ADMIN: un correo de credenciales agotó sus reintentos.
  MAIL_FAILED: {
    icon: MailX,
    label: "Correo fallido",
    tint: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
  // Solo la ve el ADMIN: llegó una solicitud de inscripción desde la landing.
  ENROLLMENT_REQUEST: {
    icon: UserPlus,
    label: "Solicitud de inscripción",
    tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
};

/** Fallback defensivo si llegara un tipo desconocido. */
export function metaFor(type: NotificationType) {
  return (
    NOTIFICATION_META[type] ?? {
      icon: Mail,
      label: "Notificación",
      tint: "bg-muted text-muted-foreground",
    }
  );
}

/** Tiempo relativo en es-BO, sin dependencias (ej. "Hace 3 h"). */
export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "Justo ahora";
  if (min < 60) return `Hace ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `Hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "numeric",
    month: "short",
  });
}

/** Fecha y hora completas (ej. "21 de junio de 2026, 18:42"). */
export function formatFull(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
