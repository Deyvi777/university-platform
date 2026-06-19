import { NextResponse, type NextRequest } from "next/server";
import { signOut } from "@/auth";

/**
 * Cierre de sesión por token inválido / vencido.
 *
 * Cuando un Server Component admin recibe un 401 del backend (la cookie de
 * NextAuth sigue presente, pero su `accessToken` ya no sirve: token vencido,
 * usuario inactivo, DB reseedeada…), NO basta con `redirect("/login")`: la
 * sesión de NextAuth sigue "válida", así que `login/page.tsx` rebota al usuario
 * de vuelta a `/dashboard` → 401 → /login → … (ERR_TOO_MANY_REDIRECTS).
 *
 * Un Server Component no puede ESCRIBIR/BORRAR cookies en Next 16 — solo los
 * Route Handlers y las Server Actions pueden. Por eso el path de lectura admin
 * redirige aquí: este handler limpia la cookie de sesión muerta vía `signOut`
 * y recién entonces manda a `/login?expired=1`. Sin sesión, `login/page.tsx`
 * ya no rebota: renderiza el formulario con el aviso de expiración.
 *
 * El matcher de `proxy.ts` excluye `/api`, así que esta ruta no está protegida
 * y nunca participa del bucle.
 */
export async function GET(request: NextRequest) {
  // `redirect: false`: limpiamos la cookie sin que `signOut` emita su propia
  // respuesta de redirección, y devolvemos la nuestra hacia /login.
  await signOut({ redirect: false });

  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set("expired", "1");
  return NextResponse.redirect(loginUrl);
}
