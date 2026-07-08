"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Barra de acciones de la vista imprimible (oculta al imprimir vía `print:hidden`).
 * "Descargar PDF" abre el diálogo de impresión del navegador → Guardar como PDF.
 * `backHref` permite reutilizarla tanto desde el kárdex del estudiante como
 * desde las vistas del ADMIN (notas/kárdex de un estudiante) y la libreta del
 * módulo; `className` ajusta el ancho al del documento (p. ej. `max-w-5xl`).
 */
export function PrintBar({
  backHref = "/dashboard/kardex",
  className,
}: {
  backHref?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto mb-6 flex max-w-3xl items-center justify-between gap-3 print:hidden",
        className,
      )}
    >
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-full bg-blue-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <Printer className="size-4" aria-hidden="true" />
        Descargar PDF
      </button>
    </div>
  );
}
