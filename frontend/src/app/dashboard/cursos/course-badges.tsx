import { Badge } from "@/components/ui/badge";
import type { CourseStatus } from "@/lib/api/admin";

const STATUS_META: Record<
  CourseStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Borrador",
    className:
      "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/25 dark:bg-slate-500/15 dark:text-slate-300",
  },
  ACTIVE: {
    label: "Activo",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  FINISHED: {
    label: "Finalizado",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/15 dark:text-sky-300",
  },
  ARCHIVED: {
    label: "Archivado",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300",
  },
};

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.DRAFT;
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  );
}
