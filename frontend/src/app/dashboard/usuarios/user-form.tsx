"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AdminUser } from "@/lib/api/admin";
import {
  createUserAction,
  updateUserAction,
} from "@/app/dashboard/usuarios/actions";
import {
  createUserFormSchema,
  editUserFormSchema,
  GENDER_LABELS,
  GENDERS,
  generateStudentPassword,
  toCreateUserPayload,
  toEditUserPayload,
  toUserFormValues,
  type UserFormRole,
  type UserFormValues,
} from "@/app/dashboard/usuarios/user-schema";

const GENDER_OPTIONS = GENDERS.map((value) => ({
  value,
  label: GENDER_LABELS[value],
}));

export function UserForm({
  user,
  defaultRole,
  backHref = "/dashboard/usuarios",
  variant = "page",
  onSuccess,
  onCancel,
}: {
  user?: AdminUser;
  defaultRole?: UserFormRole;
  backHref?: string;
  /** "page" envuelve el form en una tarjeta; "dialog" lo deja sin chrome. */
  variant?: "page" | "dialog";
  /** Si se pasa, se llama tras crear/editar (en vez de navegar a `backHref`). */
  onSuccess?: () => void;
  /** Si se pasa, lo invoca el botón Cancelar (en vez de navegar a `backHref`). */
  onCancel?: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(user);
  // Etiqueta del botón de creación según el rol que se está creando.
  const createLabel =
    (defaultRole ?? "PROFESSOR") === "STUDENT"
      ? "Crear estudiante"
      : "Crear docente";
  const [showPassword, setShowPassword] = useState(false);
  // Error a nivel de formulario (p. ej. 409 correo duplicado del backend).
  const [formError, setFormError] = useState<string | null>(null);

  // En edición la contraseña es opcional; ambas formas comparten todos los demás
  // campos, así que reutilizamos un único tipo de formulario y casteamos el
  // resolver (la unión create/edit difiere solo en la opcionalidad de password).
  const resolver = zodResolver(
    isEdit ? editUserFormSchema : createUserFormSchema,
  ) as Resolver<UserFormValues>;

  const { register, control, handleSubmit, setError, formState } =
    useForm<UserFormValues>({
      resolver,
      defaultValues: toUserFormValues(user, defaultRole),
    });
  const { errors, isSubmitting } = formState;

  // Rol efectivo del formulario (fijo por sección al crear; el actual al editar).
  const effectiveRole: UserFormRole =
    user?.role === "STUDENT" || user?.role === "PROFESSOR"
      ? user.role
      : (defaultRole ?? "PROFESSOR");
  // Al ALTA de un estudiante la contraseña se genera automáticamente: se oculta
  // el campo y el documento pasa a ser obligatorio.
  const isStudentCreate = !isEdit && effectiveRole === "STUDENT";

  // Vista previa en vivo de la contraseña generada (solo alta de estudiante).
  // `useWatch` (en vez de `watch`) es compatible con React Compiler.
  const [watchedFirst, watchedLast, watchedDoc] = useWatch({
    control,
    name: ["firstName", "lastName", "idDocument"],
  });
  const passwordPreview =
    isStudentCreate &&
    watchedFirst?.trim() &&
    watchedLast?.trim() &&
    watchedDoc?.trim()
      ? generateStudentPassword(watchedFirst, watchedLast, watchedDoc)
      : null;

  async function onSubmit(values: UserFormValues) {
    setFormError(null);
    const result =
      isEdit && user
        ? await updateUserAction(user.id, toEditUserPayload(values))
        : await createUserAction(toCreateUserPayload(values));

    if (result.ok) {
      toast.success(isEdit ? "Usuario actualizado" : "Usuario creado");
      router.refresh();
      if (onSuccess) onSuccess();
      else router.push(backHref);
      return;
    }

    // El backend devuelve 409 con un mensaje cuando el correo ya está en uso.
    // Lo anclamos al campo de correo y también lo mostramos como banner + toast.
    if (/correo|email|registrad|uso|exist/i.test(result.error)) {
      setError("email", { type: "server", message: result.error });
    }
    setFormError(result.error);
    toast.error(result.error);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={
        variant === "dialog"
          ? "space-y-6"
          : "max-w-2xl space-y-6 rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none"
      }
    >
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Apellido</Label>
          <Input
            id="lastName"
            autoComplete="family-name"
            aria-invalid={errors.lastName ? true : undefined}
            aria-describedby={errors.lastName ? "lastName-error" : undefined}
            {...register("lastName")}
          />
          {errors.lastName && (
            <p id="lastName-error" className="text-xs text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="firstName">Nombre</Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            aria-invalid={errors.firstName ? true : undefined}
            aria-describedby={
              errors.firstName ? "firstName-error" : undefined
            }
            {...register("firstName")}
          />
          {errors.firstName && (
            <p id="firstName-error" className="text-xs text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            {...register("phone")}
          />
          {errors.phone && (
            <p id="phone-error" className="text-xs text-destructive">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gender">Género</Label>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select
                items={GENDER_OPTIONS}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id="gender"
                  className="w-full"
                  aria-invalid={errors.gender ? true : undefined}
                  aria-describedby={
                    errors.gender ? "gender-error" : undefined
                  }
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && (
            <p id="gender-error" className="text-xs text-destructive">
              {errors.gender.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="idDocument">Documento de identidad</Label>
          <Input
            id="idDocument"
            inputMode="numeric"
            aria-invalid={errors.idDocument ? true : undefined}
            aria-describedby={
              errors.idDocument ? "idDocument-error" : undefined
            }
            {...register("idDocument")}
          />
          {errors.idDocument && (
            <p id="idDocument-error" className="text-xs text-destructive">
              {errors.idDocument.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="issuedIn">
            Expedido en
            <span className="ml-2 font-normal text-muted-foreground">
              (opcional)
            </span>
          </Label>
          <Input
            id="issuedIn"
            placeholder="La Paz, Santa Cruz…"
            aria-invalid={errors.issuedIn ? true : undefined}
            aria-describedby={errors.issuedIn ? "issuedIn-error" : undefined}
            {...register("issuedIn")}
          />
          {errors.issuedIn && (
            <p id="issuedIn-error" className="text-xs text-destructive">
              {errors.issuedIn.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="originUniversity">
            Universidad de origen
            <span className="ml-2 font-normal text-muted-foreground">
              (opcional)
            </span>
          </Label>
          <Input
            id="originUniversity"
            aria-invalid={errors.originUniversity ? true : undefined}
            aria-describedby={
              errors.originUniversity ? "originUniversity-error" : undefined
            }
            {...register("originUniversity")}
          />
          {errors.originUniversity && (
            <p id="originUniversity-error" className="text-xs text-destructive">
              {errors.originUniversity.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profession">
            Profesión
            <span className="ml-2 font-normal text-muted-foreground">
              (opcional)
            </span>
          </Label>
          <Input
            id="profession"
            aria-invalid={errors.profession ? true : undefined}
            aria-describedby={
              errors.profession ? "profession-error" : undefined
            }
            {...register("profession")}
          />
          {errors.profession && (
            <p id="profession-error" className="text-xs text-destructive">
              {errors.profession.message}
            </p>
          )}
        </div>
      </div>

      {isStudentCreate ? (
        // Alta de estudiante: la contraseña se genera automáticamente.
        <div className="space-y-1.5">
          <Label>Contraseña</Label>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            Se genera automáticamente: inicial del nombre + inicial del apellido
            + documento de identidad.
            {passwordPreview ? (
              <>
                {" "}
                Contraseña del estudiante:{" "}
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-foreground">
                  {passwordPreview}
                </code>
              </>
            ) : (
              <> Completa nombre, apellido y documento para verla.</>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="password">
            Contraseña
            {isEdit && (
              <span className="ml-2 font-normal text-muted-foreground">
                (déjala vacía para no cambiarla)
              </span>
            )}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={isEdit ? "••••••••" : "Mínimo 6 caracteres"}
              className="pr-10"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Switch
              id="isActive"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="isActive" className="font-normal">
          Cuenta activa (puede iniciar sesión)
        </Label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Guardar cambios" : createLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => (onCancel ? onCancel() : router.push(backHref))}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
