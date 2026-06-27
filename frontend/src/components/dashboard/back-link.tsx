import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Enlace "Volver a ..." unificado del panel: una píldora moderna con un badge
 * circular para la flecha que se desliza a la izquierda al pasar el cursor.
 * Reemplaza los `<Link>` sueltos repartidos por el dashboard.
 */
export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border bg-card/70 py-1.5 pr-4 pl-1.5 text-sm font-medium text-muted-foreground shadow-xs backdrop-blur transition-all hover:border-sky-300 hover:text-foreground hover:shadow-sm focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:outline-none dark:hover:border-sky-500/40",
        className,
      )}
    >
      <span
        className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-sky-100 group-hover:text-sky-700 dark:group-hover:bg-sky-500/20 dark:group-hover:text-sky-300"
        aria-hidden="true"
      >
        <ArrowLeft className="size-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
      </span>
      {children}
    </Link>
  );
}
