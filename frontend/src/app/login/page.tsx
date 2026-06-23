import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;
  const sessionExpired = expired === "1";

  // Si ya hay sesión, no mostramos el login: vamos directo al panel.
  // Excepción: `?expired=1` (la sesión fue invalidada por un 401 del backend).
  // En ese flujo el Route Handler /api/auth/session-expired ya cerró la sesión,
  // pero gateamos el rebote con esta bandera para no reintroducir el bucle de
  // redirección si quedara cualquier sesión residual/"rolling".
  // Solo rebotamos al panel si el token del backend SIGUE vigente. El callback
  // `session` (auth.config.ts) pone `accessToken = undefined` cuando venció, así
  // que es la señal canónica de "sesión realmente usable". Sin este chequeo, una
  // cookie viva con token vencido rebota a /dashboard, el middleware (`authorized`)
  // la rechaza por token vencido y devuelve a /login → bucle (ERR_TOO_MANY_REDIRECTS).
  // Con token vencido renderizamos el formulario para que el usuario reingrese.
  const session = await auth();
  if (session?.user && session.accessToken && !sessionExpired) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Imagen de fondo a pantalla completa. */}
      <Image
        src="/landing/image-login.webp"
        alt=""
        fill
        priority
        className="object-cover"
      />
      {/* Overlay oscuro: garantiza contraste del logo blanco y aísla la tarjeta
          glass del fondo. Gradiente sutil para dar profundidad. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-blue-950/25 via-blue-950/15 to-blue-950/35"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        {/* Logo blanco — válido solo sobre la imagen oscura. */}
        <Link
          href="/"
          aria-label="Ir al inicio de Certificate"
          className="mb-8 inline-flex items-center rounded-lg focus-visible:ring-3 focus-visible:ring-amber-400/60 focus-visible:outline-none"
        >
          <Image
            src="/landing/logo.webp"
            alt="Certificate"
            width={224}
            height={59}
            priority
            className="h-14 w-auto drop-shadow-lg sm:h-16"
          />
        </Link>

        {/* Tarjeta glass real: navy translúcido + blur fuerte para que la imagen
            de fondo se perciba a través del card. Contenido en tono claro
            (tema "sobre-imagen"), no el tema claro de shadcn — ver login-form. */}
        <div className="w-full rounded-2xl border border-white/20 bg-blue-950/10 p-8 shadow-2xl shadow-blue-950/50 backdrop-blur-lg">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Iniciar sesión
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Ingresa tus datos para acceder a tu cuenta.
            </p>
          </div>

          <LoginForm sessionExpired={sessionExpired} />

          <p className="mt-8 border-t border-white/15 pt-6 text-center text-xs text-white/65">
            ¿Problemas para ingresar? Contacta a la administración de
            Certificate.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-white/80">
          © {new Date().getFullYear()} Certificate · Escuela de Postgrado
        </p>
      </div>
    </main>
  );
}
