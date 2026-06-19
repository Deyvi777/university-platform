import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  // Llega como string desde la server action ("true"/"false"); el backend lo
  // recibe como booleano para decidir el TTL del token ("Recordarme").
  remember: z.enum(["true", "false"]).optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const res = await fetch(`${process.env.API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: parsed.data.email,
            password: parsed.data.password,
            remember: parsed.data.remember === "true",
          }),
        });
        if (!res.ok) return null;

        const data: {
          accessToken: string;
          user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
          };
        } = await res.json();

        return {
          id: data.user.id,
          email: data.user.email,
          name: `${data.user.firstName} ${data.user.lastName}`,
          role: data.user.role,
          accessToken: data.accessToken,
        };
      },
    }),
  ],
});
