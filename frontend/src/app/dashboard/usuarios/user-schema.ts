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
  role: z.enum(USER_ROLES, { error: "Selecciona un rol" }),
  isActive: z.boolean(),
};

/** Crear: contraseña obligatoria (min 8). */
export const createUserFormSchema = z.object({
  ...baseShape,
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

/**
 * Editar: la contraseña es opcional. Vacía = no se cambia; si se escribe algo,
 * debe tener al menos 8 caracteres (igual que el backend, que re-hashea solo si
 * llega `password`).
 */
export const editUserFormSchema = z.object({
  ...baseShape,
  password: z
    .union([z.literal(""), z.string().min(8, "Mínimo 8 caracteres")])
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

export function toUserFormValues(user?: AdminUser): UserFormValues {
  return {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role === "STUDENT" ? "STUDENT" : "PROFESSOR",
    isActive: user?.isActive ?? true,
  };
}

/** Para CREAR: incluye siempre la contraseña. */
export function toCreateUserPayload(values: CreateUserFormValues): UserPayload {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    password: values.password,
    role: values.role,
    isActive: values.isActive,
  };
}

/** Para EDITAR: omite la contraseña si viene vacía (el backend la mantiene). */
export function toEditUserPayload(values: UserFormValues): UserPayload {
  const payload: UserPayload = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    role: values.role,
    isActive: values.isActive,
  };
  if (values.password && values.password.length > 0) {
    payload.password = values.password;
  }
  return payload;
}
