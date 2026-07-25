import type { FieldPath } from "react-hook-form";
import type { UserFormValues } from "@/app/dashboard/usuarios/user-schema";

/**
 * Identifica el campo único al que corresponde un conflicto del backend.
 * Las comprobaciones son específicas porque ambos mensajes contienen palabras
 * genéricas como "existe" y no deben terminar asociados siempre al correo.
 */
export function uniqueUserFieldFromMessage(
  message: string,
): FieldPath<UserFormValues> | null {
  if (/documento(?: de identidad)?|idDocument/i.test(message)) {
    return "idDocument";
  }
  if (/correo|email/i.test(message)) {
    return "email";
  }
  return null;
}
