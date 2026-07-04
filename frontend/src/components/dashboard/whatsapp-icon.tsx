import { SOCIAL_DEFS } from "@/components/landing/social-defs";

const WHATSAPP_PATH =
  SOCIAL_DEFS.find((s) => s.key === "whatsapp")?.path ?? "";

/**
 * Glifo de WhatsApp (simple-icons, como en `WhatsAppButton`/footer) con la
 * misma interfaz que un icono de Lucide (`className`), para usarlo donde el
 * icono se elige dinámicamente (p. ej. el botón de acción de una notificación).
 */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d={WHATSAPP_PATH} />
    </svg>
  );
}
