/**
 * Cookie auxiliar (HttpOnly) que conserva la elección hecha en el login.
 * Auth.js renueva su cookie JWT desde el proxy y desde `/api/auth/session`,
 * por lo que necesitamos reaplicar en esas respuestas la política elegida.
 */
export const REMEMBER_PREFERENCE_COOKIE = "certificate.remember-session";

export const REMEMBER_SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export function isAuthSessionCookieName(name: string): boolean {
  return (
    name === "authjs.session-token" ||
    name === "__Secure-authjs.session-token" ||
    name.startsWith("authjs.session-token.") ||
    name.startsWith("__Secure-authjs.session-token.")
  );
}

/**
 * Auth.js agrega `Expires` cada vez que renueva la sesión. Si el usuario no
 * marcó "Recordarme", quitamos cualquier caducidad de sus cookies de sesión
 * para que el navegador las elimine al cerrarse.
 */
export function enforceAuthCookiePersistence(
  response: Response,
  rememberPreference: string | undefined,
): Response {
  if (rememberPreference !== "session") return response;

  const setCookies = response.headers.getSetCookie();
  if (setCookies.length === 0) return response;

  let changed = false;
  const normalizedCookies = setCookies.map((setCookie) => {
    const separator = setCookie.indexOf("=");
    const cookieName = separator === -1 ? "" : setCookie.slice(0, separator).trim();
    if (!isAuthSessionCookieName(cookieName)) return setCookie;

    changed = true;
    return setCookie
      .replace(/;\s*Expires=[^;]*/gi, "")
      .replace(/;\s*Max-Age=[^;]*/gi, "");
  });

  if (!changed) return response;

  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  for (const setCookie of normalizedCookies) {
    headers.append("set-cookie", setCookie);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
