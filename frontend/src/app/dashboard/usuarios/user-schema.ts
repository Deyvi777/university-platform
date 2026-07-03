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

export const GENDERS = ["MALE", "FEMALE"] as const;
export type UserFormGender = (typeof GENDERS)[number];
export const GENDER_LABELS: Record<UserFormGender, string> = {
  MALE: "Masculino",
  FEMALE: "Femenino",
};

const baseShape = {
  firstName: z.string().trim().min(1, "Requerido"),
  lastName: z.string().trim().min(1, "Requerido"),
  email: z.email("Correo electrónico no válido").trim().min(1, "Requerido"),
  phone: z.string().trim().min(1, "Requerido"),
  // Documento de identidad (carnet): obligatorio y único (la unicidad la valida
  // el backend → 409 si se repite).
  idDocument: z.string().trim().min(1, "Requerido"),
  // "Expedido en": lugar de emisión del documento (opcional).
  issuedIn: z.string().trim().optional(),
  // Género: obligatorio.
  gender: z.enum(GENDERS, { error: "Selecciona el género" }),
  // Universidad de origen y profesión: opcionales.
  originUniversity: z.string().trim().optional(),
  profession: z.string().trim().optional(),
  role: z.enum(USER_ROLES, { error: "Selecciona un rol" }),
  isActive: z.boolean(),
};

/**
 * Contraseña automática de un estudiante nuevo: inicial del nombre + inicial
 * del apellido (mayúsculas) + documento de identidad. Ej.: Juan Pérez, CI
 * 1234567 → "JP1234567". Debe coincidir con `generateStudentPassword` del
 * backend (`users.service.ts`). Se usa para la vista previa en el formulario.
 */
export function generateStudentPassword(
  firstName: string,
  lastName: string,
  idDocument: string,
): string {
  const f = firstName.trim().charAt(0).toUpperCase();
  const l = lastName.trim().charAt(0).toUpperCase();
  return `${f}${l}${idDocument.trim()}`;
}

/**
 * Crear: la contraseña depende del rol.
 * - STUDENT: **no** se pide contraseña (la genera el backend); en cambio el
 *   documento de identidad es obligatorio (es la base de esa contraseña).
 * - PROFESSOR: contraseña manual obligatoria (min 6).
 */
export const createUserFormSchema = z
  .object({
    ...baseShape,
    password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // El documento ya es obligatorio en el esquema base. Aquí solo falta exigir
    // la contraseña manual del docente (el estudiante la recibe autogenerada).
    if (data.role === "PROFESSOR" && (!data.password || data.password.length < 6)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Mínimo 6 caracteres",
      });
    }
  });

/**
 * Editar: la contraseña es opcional (para cualquier rol). Vacía = no se cambia;
 * si se escribe algo, debe tener al menos 6 caracteres. La edición NO regenera
 * la contraseña del estudiante (eso es solo en el alta).
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
    issuedIn: user?.issuedIn ?? "",
    // Género por defecto MALE (coincide con el default del backend).
    gender: user?.gender ?? "MALE",
    originUniversity: user?.originUniversity ?? "",
    profession: user?.profession ?? "",
    password: "",
    role: user?.role === "STUDENT" || user?.role === "PROFESSOR"
      ? user.role
      : defaultRole,
    isActive: user?.isActive ?? true,
  };
}

/** Texto opcional: trim y cadena vacía → null. */
function normalizeOptional(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Para CREAR. La contraseña **solo** se envía para docentes: la de un
 * estudiante la genera el backend (inicial nombre + inicial apellido +
 * documento), así que se omite del payload.
 */
export function toCreateUserPayload(values: CreateUserFormValues): UserPayload {
  const payload: UserPayload = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    idDocument: values.idDocument.trim(),
    issuedIn: normalizeOptional(values.issuedIn),
    gender: values.gender,
    originUniversity: normalizeOptional(values.originUniversity),
    profession: normalizeOptional(values.profession),
    role: values.role,
    isActive: values.isActive,
  };
  if (values.role === "PROFESSOR" && values.password) {
    payload.password = values.password;
  }
  return payload;
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
    idDocument: values.idDocument.trim(),
    issuedIn: normalizeOptional(values.issuedIn),
    gender: values.gender,
    originUniversity: normalizeOptional(values.originUniversity),
    profession: normalizeOptional(values.profession),
    isActive: values.isActive,
  };
  if (values.password && values.password.length > 0) {
    payload.password = values.password;
  }
  return payload;
}
