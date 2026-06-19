"use server";

import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";

// Espeja el contrato de credenciales del backend (ver src/auth.ts).
const loginSchema = z.object({
  email: z.email({ message: "Ingresa un correo electrónico válido." }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
});

export type LoginState = {
  // Error general (credenciales inválidas / fallo de red).
  error?: string;
  // Errores de validación por campo, en español.
  fieldErrors?: {
    email?: string;
    password?: string;
  };
  // Valores a re-hidratar tras un intento fallido. React 19 resetea el
  // <form action={fn}> en cada submit, así que devolvemos el correo enviado
  // para usarlo como defaultValue y que el usuario no tenga que re-teclearlo.
  // La contraseña no se conserva (práctica habitual de seguridad).
  values?: {
    email?: string;
  };
};

const INVALID_CREDENTIALS =
  "Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.";
const UNEXPECTED_ERROR =
  "No pudimos iniciar sesión en este momento. Inténtalo nuevamente en unos minutos.";

export async function authenticate(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // Correo crudo tal cual lo escribió el usuario, para re-hidratar el campo en
  // cualquier rama de fallo (incluso si el correo es inválido).
  const submittedEmail =
    typeof formData.get("email") === "string"
      ? (formData.get("email") as string)
      : "";
  const values = { email: submittedEmail };

  const parsed = loginSchema.safeParse({
    email: submittedEmail,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error);
    return {
      values,
      fieldErrors: {
        email: flattened.fieldErrors.email?.[0],
        password: flattened.fieldErrors.password?.[0],
      },
    };
  }

  // Checkbox "Recordarme": presente como "on" cuando está marcado, ausente si no.
  // - Marcado  → token de larga duración en el backend (JWT_REMEMBER_EXPIRES_IN)
  //   y cookie de sesión *persistente* (la que pone NextAuth por defecto, con
  //   Max-Age = session.maxAge). El usuario sigue logueado entre reinicios del
  //   navegador hasta que caduque.
  // - Sin marcar → token corto y, además, rebajamos la cookie a *cookie de
  //   sesión* (sin Max-Age/Expires) para que el navegador la borre al cerrarse.
  const remember = formData.get("remember") === "on";

  // Usamos redirect:false para recuperar el control tras el signIn y poder
  // ajustar la cookie antes de redirigir nosotros mismos. Con redirect:false,
  // una credencial inválida NO lanza: signIn devuelve una URL con `?error=`.
  let result: string | undefined;
  try {
    result = (await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      remember: remember ? "true" : "false",
      redirectTo: "/dashboard",
      redirect: false,
    })) as string | undefined;
  } catch (error) {
    // Por robustez seguimos contemplando que alguna versión lance AuthError.
    unstable_rethrow(error);
    if (error instanceof AuthError) {
      return { values, error: INVALID_CREDENTIALS };
    }
    return { values, error: UNEXPECTED_ERROR };
  }

  if (!result || /[?&]error=/.test(result)) {
    return { values, error: INVALID_CREDENTIALS };
  }

  // Éxito: signIn ya escribió la cookie de sesión (persistente). Si el usuario
  // no marcó "Recordarme", la convertimos en cookie de sesión-only.
  if (!remember) {
    await makeSessionCookieEphemeral();
  }

  // redirect() lanza NEXT_REDIRECT (fuera del try → se propaga correctamente).
  redirect("/dashboard");
}

/**
 * Rebaja la cookie de sesión de NextAuth a una *cookie de sesión* (sin
 * `Max-Age`/`Expires`) reescribiéndola con el mismo valor pero sin caducidad,
 * de modo que el navegador la elimine al cerrarse. Cubre el nombre por defecto
 * (`authjs.session-token`), su variante `__Secure-` en HTTPS y los fragmentos
 * (`.0`, `.1`, …) cuando el JWT es grande y NextAuth lo parte en varias cookies.
 */
async function makeSessionCookieEphemeral(): Promise<void> {
  const jar = await cookies();
  for (const c of jar.getAll()) {
    const isSessionToken =
      c.name === "authjs.session-token" ||
      c.name === "__Secure-authjs.session-token" ||
      c.name.startsWith("authjs.session-token.") ||
      c.name.startsWith("__Secure-authjs.session-token.");
    if (!isSessionToken) continue;

    jar.set(c.name, c.value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // El prefijo __Secure- exige el flag secure; en dev (http) no lo lleva.
      secure: c.name.startsWith("__Secure-"),
      // Sin maxAge ni expires ⇒ cookie de sesión (se borra al cerrar el navegador).
    });
  }
}
