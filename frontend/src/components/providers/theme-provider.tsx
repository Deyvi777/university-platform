"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Proveedor de tema (claro/oscuro) para toda la app, respaldado por `next-themes`.
 *
 * - `attribute="class"` → next-themes alterna la clase `.dark` en `<html>`, que es
 *   exactamente el selector que usan los tokens de shadcn (`@custom-variant dark`
 *   en `globals.css`).
 * - `defaultTheme="dark"` + `enableSystem={false}` → el **modo oscuro (navy
 *   institucional) es el predeterminado** para usuarios nuevos, sin depender de la
 *   preferencia del sistema operativo. La elección del usuario se persiste en
 *   `localStorage` (lo hace next-themes) y sobreescribe el default en visitas
 *   posteriores.
 * - `disableTransitionOnChange` → evita el "barrido" de transiciones de color al
 *   cambiar de tema (respeta también `prefers-reduced-motion`).
 *
 * El `<html>` del root layout lleva `suppressHydrationWarning` porque next-themes
 * fija la clase del tema en el cliente antes de la hidratación.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
