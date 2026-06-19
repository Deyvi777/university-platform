import type { NextAuthConfig } from "next-auth";

/**
 * Lee el `exp` (epoch en segundos) de un JWT del backend sin verificar la firma
 * — solo necesitamos saber si ya venció. Edge-safe: usa `atob`, disponible en el
 * runtime del middleware (sin `Buffer` de Node).
 */
function getBackendTokenExp(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: number }).exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

/** ¿El `accessToken` del backend ya venció? (con 30 s de margen). */
function isBackendTokenExpired(token: string | undefined): boolean {
  if (!token) return true;
  const exp = getBackendTokenExp(token);
  if (exp === null) return false; // sin `exp` legible no asumimos expiración
  return Date.now() >= (exp - 30) * 1000;
}

// Edge-safe config: imported by proxy.ts, must not pull in Node-only modules.
export const authConfig = {
  // Requerido al self-hostear (fuera de Vercel); valida el host vía AUTH_URL.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // Cota superior de la sesión de NextAuth: debe cubrir el token más largo que
    // el backend pueda emitir, es decir el de "Recordarme" (JWT_REMEMBER_EXPIRES_IN,
    // 30 días). Quien NO marca "Recordarme" recibe un token de 1 día: la sesión no
    // sobrevive a ese token porque los callbacks `authorized`/`session` decodifican
    // el `exp` real del accessToken (isBackendTokenExpired) y lo invalidan en cuanto
    // caduca, mandando a /login antes de que cualquier llamada admin falle. Así el
    // `exp` del backend es la fuente de verdad de la duración, no este maxAge.
    maxAge: 30 * 24 * 60 * 60, // 30 días (en segundos), = JWT_REMEMBER_EXPIRES_IN
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = nextUrl.pathname.startsWith("/dashboard");
      if (isProtected && !isLoggedIn) {
        return false;
      }
      // Token del backend vencido aunque la sesión de NextAuth siga "viva"
      // (sesiones JWT rolling vs. accessToken de TTL fijo): tratamos la ruta
      // protegida como no autorizada para que el middleware mande a /login
      // antes de que cualquier llamada admin dispare un 401. Cubre el caso de
      // expiración por tiempo; el resto de 401 (usuario inactivo, DB
      // reseedeada) los cubre /api/auth/session-expired desde el path admin.
      if (isProtected && isBackendTokenExpired(auth?.accessToken)) {
        return false;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      // Si el token del backend ya venció, no lo exponemos en la sesión: el
      // path admin (`adminFetch`) verá "sin token" y redirigirá a
      // /api/auth/session-expired, que cierra la sesión muerta de forma limpia.
      session.accessToken = isBackendTokenExpired(token.accessToken)
        ? undefined
        : token.accessToken;
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
