import { Button } from "@/components/ui/button";
import { SOCIAL_DEFS } from "@/components/landing/social-defs";

const WHATSAPP_PATH =
  SOCIAL_DEFS.find((s) => s.key === "whatsapp")?.path ?? "";

/**
 * Normaliza un teléfono a formato internacional para `wa.me`. Los números se
 * guardan en formato local boliviano (8 dígitos), así que si no traen el código
 * de país le anteponemos `591`.
 */
function toWaNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("591") ? digits : `591${digits}`;
}

/** Botón (icono verde) que abre WhatsApp con el teléfono del usuario. */
export function WhatsAppButton({
  phone,
  name,
}: {
  phone: string;
  name: string;
}) {
  const number = toWaNumber(phone);
  if (!number) return null;

  return (
    <Button
      nativeButton={false}
      variant="ghost"
      size="icon-sm"
      className="text-green-600 hover:bg-green-600/10 hover:text-green-600 dark:text-green-400 dark:hover:text-green-400"
      render={
        <a
          href={`https://wa.me/${number}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Escribir a ${name} por WhatsApp`}
        />
      }
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={WHATSAPP_PATH} />
      </svg>
    </Button>
  );
}
