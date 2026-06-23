"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

/**
 * Barra de acciones de la vista imprimible (oculta al imprimir vía `.no-print`).
 * "Descargar PDF" abre el diálogo de impresión del navegador → Guardar como PDF.
 */
export function PrintBar() {
  return (
    <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between gap-3 print:hidden">
      <Link
        href="/dashboard/kardex"
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
