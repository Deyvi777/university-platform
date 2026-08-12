import NextAuth from "next-auth";
import {
  NextResponse,
  type NextFetchEvent,
  type NextMiddleware,
  type NextRequest,
} from "next/server";
import { authConfig } from "./auth.config";
import {
  enforceAuthCookiePersistence,
  REMEMBER_PREFERENCE_COOKIE,
} from "./lib/auth-cookie-policy";

// Importa solo authConfig (edge-safe), no ./auth: el provider Credentials
// hace fetch al backend y no debe ejecutarse en el proxy.
// `auth` es una función sobrecargada (RSC, Route Handler y Proxy); al extraerla
// TypeScript elige la firma de API Routes. En este archivo siempre se usa como
// middleware de Next, así que fijamos esa firma explícitamente.
const authProxy = NextAuth(authConfig).auth as unknown as NextMiddleware;

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const authResponse = await authProxy(request, event);
  const response =
    authResponse instanceof Response ? authResponse : NextResponse.next();

  return enforceAuthCookiePersistence(
    response,
    request.cookies.get(REMEMBER_PREFERENCE_COOKIE)?.value,
  );
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
