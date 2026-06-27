import { z } from "zod";
import type { AdminUser } from "@/lib/api/admin";
import type { UserPayload } from "@/app/dashboard/admin-types";

/**
 * Espeja el DTO Zod del backend para `POST /admin/users`:
 *   { firstName: min1, lastName: min1, email: email, password: min8,
 *     role: "PROFESSOR" | "STUDENT", isActive?: boolean (default true) }
 *
 * El rol SOLO puede ser PROFESSOR o STUDENT (ADMIN → 400 en el backend), así que
 * el enum del formulario lo restringe a esos dos valores.
 */
export const USER_ROLES = ["PROFESSOR", "STUDENT"] as const;
export type UserFormRole = (typeof USER_ROLES)[number];

const baseShape = {
  firstName: z.string().trim().min(1, "Requerido"),
  lastName: z.string().trim().min(1, "Requerido"),
  email: z.email("Correo electrónico no válido").trim().min(1, "Requerido"),
  phone: z.string().trim().min(1, "Requerido"),
  // Documento de identidad (carnet): opcional.
  idDocument: z.string().trim().optional(),
  role: z.enum(USER_ROLES, { error: "Selecciona un rol" }),
  isActive: z.boolean(),
};

/** Crear: contraseña obligatoria (min 6). */
export const createUserFormSchema = z.object({
  ...baseShape,
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

/**
 * Editar: la contraseña es opcional. Vacía = no se cambia; si se escribe algo,
 * debe tener al menos 6 caracteres (igual que el backend, que re-hashea solo si
 * llega `password`).
 */
export const editUserFormSchema = z.object({
  ...baseShape,
  password: z
    .union([z.literal(""), z.string().min(6, "Mínimo 6 caracteres")])
    .optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;
export type EditUserFormValues = z.infer<typeof editUserFormSchema>;
/**
 * Tipo único del formulario (react-hook-form). Usamos la forma de creación
 * (password siempre `string`) como base; en edición la contraseña vacía es
 * válida y simplemente no se envía al backend (ver `toEditUserPayload`).
 */
export type UserFormValues = CreateUserFormValues;

export function toUserFormValues(
  user?: AdminUser,
  defaultRole: UserFormRole = "PROFESSOR",
): UserFormValues {
  return {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    idDocument: user?.idDocument ?? "",
    password: "",
    role: user?.role === "STUDENT" || user?.role === "PROFESSOR"
      ? user.role
      : defaultRole,
    isActive: user?.isActive ?? true,
  };
}

/** Documento de identidad: trim y cadena vacía → null. */
function normalizeIdDocument(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length === 0 ? null : trimmed;
}

/** Para CREAR: incluye siempre la contraseña. */
export function toCreateUserPayload(values: CreateUserFormValues): UserPayload {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    idDocument: normalizeIdDocument(values.idDocument),
    password: values.password,
    role: values.role,
    isActive: values.isActive,
  };
}

/**
 * Para EDITAR: omite la contraseña si viene vacía (el backend la mantiene) y
 * NO envía el rol — el formulario ya no lo edita, así que el update parcial del
 * backend conserva el rol actual del usuario (incluido ADMIN).
 */
export function toEditUserPayload(values: UserFormValues): UserPayload {
  const payload: UserPayload = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    idDocument: normalizeIdDocument(values.idDocument),
    isActive: values.isActive,
  };
  if (values.password && values.password.length > 0) {
    payload.password = values.password;
  }
  return payload;
}
