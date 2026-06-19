import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Importa solo authConfig (edge-safe), no ./auth: el provider Credentials
// hace fetch al backend y no debe ejecutarse en el proxy.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
