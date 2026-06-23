import { cn } from "@/lib/utils";

/**
 * Renderiza el cuerpo de una notificación resaltando en **negrita** los nombres
 * que el backend envía entre comillas angulares «…» (módulo, programa). Divide
 * el texto con un grupo de captura: los segmentos en índices impares son el
 * contenido resaltado, que se muestra sin las comillas y con énfasis.
 */
export function NotificationBody({
  text,
  className,
  strongClassName,
}: {
  text: string;
  className?: string;
  /** Clase del fragmento resaltado (por defecto, negrita y color de texto). */
  strongClassName?: string;
}) {
  const parts = text.split(/«([^»]+)»/g);
  return (
    <p className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong
            key={i}
            className={cn("font-semibold text-foreground", strongClassName)}
          >
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </p>
  );
}
