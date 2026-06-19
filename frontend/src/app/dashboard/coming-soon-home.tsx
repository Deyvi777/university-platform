import { Sparkles, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type FeatureHint = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type ComingSoonHomeProps = {
  /** Nombre del usuario para el saludo (puede venir vacío). */
  name?: string | null;
  /** Encabezado de bienvenida. */
  greeting: string;
  /** Descripción bajo el saludo. */
  intro: string;
  /** Título del bloque de estado vacío. */
  emptyTitle: string;
  /** Mensaje del estado vacío. */
  emptyDescription: string;
  /** Funcionalidades que llegarán pronto (chips informativos). */
  features: FeatureHint[];
};

/**
 * Home de PROFESSOR / STUDENT: bienvenida + estado vacío bien diseñado que
 * comunica que las funcionalidades específicas del rol llegarán pronto. Sin CTA
 * falso: el único llamado es un badge "Próximamente" intencional y honesto.
 * Copy es-BO inyectado por rol. Alineado al estilo del panel (navy + ámbar,
 * esquinas muy redondeadas, tipografía display).
 */
export function ComingSoonHome({
  name,
  greeting,
  intro,
  emptyTitle,
  emptyDescription,
  features,
}: ComingSoonHomeProps) {
  const firstName = name?.trim().split(/\s+/)[0];

  return (
    <div>
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {firstName ? `${greeting}, ${firstName}` : greeting}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{intro}</p>
      </header>

      <section
        aria-labelledby="proximamente-titulo"
        className="mt-8 overflow-hidden rounded-3xl border bg-card shadow-sm"
      >
        {/* Banda navy con resplandor ámbar sutil */}
        <div className="relative flex flex-col items-center gap-5 bg-blue-950 px-6 py-14 text-center sm:py-16">
          <div
            className="pointer-events-none absolute -top-16 left-1/2 size-56 -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl"
            aria-hidden="true"
          />
          <span
            className="relative flex size-16 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30"
            aria-hidden="true"
          >
            <Sparkles className="size-8" />
          </span>

          <div className="relative max-w-md space-y-3">
            <Badge
              variant="outline"
              className="border-amber-400/40 bg-amber-400/10 text-amber-300"
            >
              Próximamente
            </Badge>
            <h2
              id="proximamente-titulo"
              className="font-heading text-2xl font-bold tracking-tight text-white"
            >
              {emptyTitle}
            </h2>
            <p className="text-sm text-white/70">{emptyDescription}</p>
          </div>
        </div>

        {/* Chips de lo que llegará */}
        <ul className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="rounded-2xl border bg-muted/30 p-5 transition-colors hover:bg-muted/50"
            >
              <span
                className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"
                aria-hidden="true"
              >
                <feature.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
