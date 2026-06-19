import type { NextConfig } from "next";

const backendUrl = new URL(
  process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000",
);

const nextConfig: NextConfig = {
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
