"use client";

import { useState } from "react";
import { Send } from "lucide-react";

// Número de WhatsApp de Certificate (formato internacional sin "+").
const WHATSAPP_NUMBER = "59177933003";

export function ContactForm() {
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const nombre = (data.get("nombre") as string)?.trim() ?? "";
    const correo = (data.get("correo") as string)?.trim() ?? "";
    const mensaje = (data.get("mensaje") as string)?.trim() ?? "";

    // Construimos el mensaje precargado para WhatsApp.
    const lines = [
      "¡Hola! Quiero más información sobre sus programas.",
      "",
      `*Nombre:* ${nombre}`,
      correo && `*Correo:* ${correo}`,
      mensaje && `*Mensaje:* ${mensaje}`,
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join("\n"));
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

    setSending(true);
    window.open(url, "_blank", "noopener,noreferrer");
    // Pequeño respiro visual; el envío real ocurre en WhatsApp.
    window.setTimeout(() => setSending(false), 1200);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Nombre completo"
          name="nombre"
          type="text"
          placeholder="Tu nombre"
          required
        />
        <Field
          label="Correo electrónico"
          name="correo"
          type="email"
          placeholder="tucorreo@ejemplo.com"
        />
      </div>

      <div>
        <label
          htmlFor="mensaje"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Mensaje
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          rows={4}
          placeholder="Ej: Me interesa una maestría o diplomado en…"
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-amber-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-amber-400/20"
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-amber-400 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-400/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-400/40 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />
        <Send className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        <span className="relative">
          {sending ? "Abriendo WhatsApp…" : "Enviar por WhatsApp"}
        </span>
      </button>

      <p className="text-xs leading-5 text-slate-500">
        Al enviar, se abrirá WhatsApp con tu mensaje listo para que confirmes el
        envío. Te responderemos a la brevedad.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-300"
      >
        {label}
        {required && <span className="ml-0.5 text-amber-400">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-amber-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-amber-400/20"
      />
    </div>
  );
}
