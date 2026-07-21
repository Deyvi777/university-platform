import type { Metadata } from "next";
import { Geist_Mono, Merriweather, Open_Sans } from "next/font/google";
import Script from "next/script";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { FloatingWhatsAppButton } from "@/components/landing/floating-whatsapp-button";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Analíticas con Umami (self-hosted en Coolify). Ambas variables se inlinean
// en el build (NEXT_PUBLIC_*): sin ellas (dev) no se inyecta nada.
const UMAMI_SRC = process.env.NEXT_PUBLIC_UMAMI_SRC;
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

const openSans = Open_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-heading",
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Certificate — Escuela Multidisciplinaria de Postgrado",
  description:
    "Maestrías, diplomados y certificaciones para profesionales. Formación continua de excelencia en Bolivia.",
  icons: {
    icon: { url: "/favicon.webp", type: "image/webp" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${openSans.variable} ${merriweather.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
          <FloatingWhatsAppButton />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        {UMAMI_SRC && UMAMI_WEBSITE_ID && (
          <Script
            src={UMAMI_SRC}
            data-website-id={UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
