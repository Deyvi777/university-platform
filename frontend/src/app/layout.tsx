import type { Metadata } from "next";
import { Geist_Mono, Merriweather, Open_Sans } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

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
      className={`${openSans.variable} ${merriweather.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
