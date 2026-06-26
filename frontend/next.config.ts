import type { NextConfig } from "next";

const backendUrl = new URL(
  process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000",
);

const nextConfig: NextConfig = {
  // Habilita la integración de React `<ViewTransition>` con la navegación:
  // permite el morph del flyer y el título de cada tarjeta de programa hacia su
  // página de detalle (ver `programs-grid.tsx` y `programas/[slug]/page.tsx`).
  experimental: {
    viewTransition: true,
  },
  // Sirve los archivos subidos (Garage/S3 vía backend) desde el propio origen
  // del frontend. Así next/image los trata como imágenes locales y los puede
  // optimizar (Next 16 bloquea la optimización de URLs remotas que resuelven a
  // IPs privadas como localhost), y el preview <img> también funciona.
  async rewrites() {
    return [
      {
        source: "/files/:path*",
        destination: `${backendUrl.origin}/files/:path*`,
      },
    ];
  },
};

export default nextConfig;
