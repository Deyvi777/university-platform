import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap, Lock, ShieldCheck } from "lucide-react";
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
  const session = await auth();
  if (session?.user && !sessionExpired) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca — azul oscuro institucional (el logo es blanco, solo va sobre oscuro). */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-blue-950 p-10 text-white lg:flex xl:p-14">
        {/* Resplandor ámbar sutil de fondo, sin competir con el texto. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-amber-400/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-amber-400/[0.06] blur-3xl"
        />

        <div className="relative">
          <Link
            href="/"
            aria-label="Ir al inicio de Certificate"
            className="inline-flex items-center"
          >
            <Image
              src="/landing/logo.webp"
              alt="Certificate"
              width={150}
              height={40}
              priority
              className="h-9 w-auto"
            />
          </Link>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-amber-300 backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-amber-400" />
            Plataforma académica
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight leading-tight xl:text-4xl">
            Bienvenido al panel de Certificate
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Gestiona programas, módulos, estudiantes y kardex desde un solo
            lugar. Accede con tus credenciales institucionales.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            <li className="flex items-center gap-3">
              <GraduationCap className="size-5 shrink-0 text-amber-400" />
              Maestrías y diplomados centralizados
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-5 shrink-0 text-amber-400" />
              Acceso por rol: administración, docencia y estudiantes
            </li>
            <li className="flex items-center gap-3">
              <Lock className="size-5 shrink-0 text-amber-400" />
              Sesión segura y cifrada
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-slate-400">
          © {new Date().getFullYear()} Certificate · Escuela de Postgrado
        </p>
      </aside>

      {/* Panel de formulario — tema claro del dashboard. */}
      <div className="flex flex-col items-center justify-center bg-muted/30 px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo compacto solo en móvil (no hay panel de marca). */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Link
              href="/"
              aria-label="Ir al inicio de Certificate"
              className="inline-flex items-center rounded-lg bg-blue-950 px-4 py-2"
            >
              <Image
                src="/landing/logo.webp"
                alt="Certificate"
                width={130}
                height={34}
                priority
                className="h-8 w-auto"
              />
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              Iniciar sesión
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingresa tus datos para acceder a tu cuenta.
            </p>
          </div>

          <LoginForm sessionExpired={sessionExpired} />

          <p className="mt-8 text-center text-xs text-muted-foreground">
            ¿Problemas para ingresar? Contacta a la administración de
            Certificate.
          </p>
        </div>
      </div>
    </main>
  );
}
