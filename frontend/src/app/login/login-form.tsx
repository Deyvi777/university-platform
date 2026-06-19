"use client";

import { useActionState, useId, useState } from "react";
import { AlertCircle, Eye, EyeOff, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authenticate, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({
  sessionExpired = false,
}: {
  sessionExpired?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    authenticate,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);

  // Mostramos el aviso de expiración solo mientras no haya un error nuevo del
  // formulario (un intento fallido posterior toma precedencia).
  const showExpiredNotice = sessionExpired && !state.error;

  // Conserva el correo tras un intento fallido. React 19 resetea el
  // <form action={fn}> en cada submit, por eso el email es controlado: lo
  // re-sembramos desde el estado devuelto por la server action (`values.email`).
  // Sincronizamos durante el render comparando el valor previo (patrón
  // recomendado por React), no en useEffect (regla react-hooks/set-state-in-effect).
  const [email, setEmail] = useState(state.values?.email ?? "");
  const [prevReturnedEmail, setPrevReturnedEmail] = useState(
    state.values?.email,
  );
  if (state.values?.email !== prevReturnedEmail) {
    setPrevReturnedEmail(state.values?.email);
    setEmail(state.values?.email ?? "");
  }

  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();
  const formErrorId = useId();

  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/* Aviso de sesión expirada (token rechazado por el backend → se cerró
          la sesión). Informativo, no destructivo. */}
      {showExpiredNotice && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-700 dark:text-amber-300"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>Tu sesión expiró. Inicia sesión nuevamente para continuar.</span>
        </div>
      )}

      {/* Error general (credenciales inválidas / fallo de red). */}
      {state.error && (
        <div
          id={formErrorId}
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={emailId}>Correo electrónico</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="nombre@certificate.edu.bo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? emailErrorId : undefined}
          disabled={pending}
        />
        {emailError && (
          <p id={emailErrorId} className="text-xs text-destructive">
            {emailError}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={passwordId}>Contraseña</Label>
        <div className="relative">
          <Input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            minLength={8}
            placeholder="••••••••"
            className="pr-10"
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={passwordError ? passwordErrorId : undefined}
            disabled={pending}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={pending}
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
        {passwordError && (
          <p id={passwordErrorId} className="text-xs text-destructive">
            {passwordError}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
          <input
            type="checkbox"
            name="remember"
            className="size-4 rounded border-input text-amber-500 accent-amber-500 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            disabled={pending}
          />
          Recordarme
        </label>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {pending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
