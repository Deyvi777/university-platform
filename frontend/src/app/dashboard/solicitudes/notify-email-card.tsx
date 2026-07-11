"use client";

import { Check, Loader2, Mail, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateNotifyEmailAction } from "@/app/dashboard/solicitudes/actions";

/**
 * Buzón que recibe el aviso por correo de cada solicitud (edición inline).
 * El valor vive en la fila única de configuración del sitio (`SiteSettings`).
 */
export function NotifyEmailCard({ email }: { email: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(email);
  const [pending, startTransition] = useTransition();

  function onSave() {
    const trimmed = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Ingresa un correo válido");
      return;
    }
    startTransition(async () => {
      const result = await updateNotifyEmailAction(trimmed);
      if (result.ok) {
        toast.success("Correo de avisos actualizado");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function onCancel() {
    setValue(email);
    setEditing(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
        <Mail className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Aviso por correo</p>
        {editing ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Input
              type="email"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSave();
                }
                if (e.key === "Escape") onCancel();
              }}
              disabled={pending}
              autoFocus
              aria-label="Correo destinatario de los avisos"
              className="h-8 max-w-xs"
            />
            <Button
              type="button"
              size="icon-sm"
              onClick={onSave}
              disabled={pending}
              aria-label="Guardar correo"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onCancel}
              disabled={pending}
              aria-label="Cancelar edición"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <p className="truncate text-sm text-muted-foreground">
            Cada solicitud nueva se envía a{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        )}
      </div>
      {!editing && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
        >
          <Pencil className="size-4" /> Cambiar
        </Button>
      )}
    </div>
  );
}
