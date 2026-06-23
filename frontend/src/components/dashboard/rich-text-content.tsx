import { cn } from "@/lib/utils";

/**
 * Renderiza HTML enriquecido (creado con el editor de "Temas") con estilos de
 * lectura. El autor es un docente de confianza, así que se inyecta el HTML
 * directamente con tipografía controlada por la clase `richtext`.
 */
export function RichTextContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={cn("richtext", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
