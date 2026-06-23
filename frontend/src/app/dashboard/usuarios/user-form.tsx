"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
  toCreateUserPayload,
  toEditUserPayload,
  toUserFormValues,
  type UserFormValues,
} from "@/app/dashboard/usuarios/user-schema";

const ROLE_OPTIONS = [
  { value: "PROFESSOR", label: "Docente" },
  { value: "STUDENT", label: "Estudiante" },
] as const;

export function UserForm({ user }: { user?: AdminUser }) {
  const router = useRouter();
  const isEdit = Boolean(user);
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
      defaultValues: toUserFormValues(user),
    });
  const { errors, isSubmitting } = formState;

  async function onSubmit(values: UserFormValues) {
    setFormError(null);
    const result =
      isEdit && user
        ? await updateUserAction(user.id, toEditUserPayload(values))
        : await createUserAction(toCreateUserPayload(values));

    if (result.ok) {
      toast.success(isEdit ? "Usuario actualizado" : "Usuario creado");
      router.push("/dashboard/usuarios");
      router.refresh();
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
      className="max-w-2xl space-y-6 rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none"
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
            placeholder={isEdit ? "••••••••" : "Mínimo 8 caracteres"}
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

      <div className="space-y-1.5">
        <Label htmlFor="role">Rol</Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select
              items={ROLE_OPTIONS}
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
            >
              <SelectTrigger
                id="role"
                className="w-full"
                aria-invalid={errors.role ? true : undefined}
                aria-describedby={errors.role ? "role-error" : undefined}
              >
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p className="text-xs text-muted-foreground">
          Solo puedes crear docentes y estudiantes desde este panel.
        </p>
        {errors.role && (
          <p id="role-error" className="text-xs text-destructive">
            {errors.role.message}
          </p>
        )}
      </div>

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
          {isEdit ? "Guardar cambios" : "Crear usuario"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => router.push("/dashboard/usuarios")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
