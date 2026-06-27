"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminUser } from "@/lib/api/admin";
import { NotificationComposeForm } from "./notification-compose-form";

/**
 * Botón "Nuevo aviso" que abre el formulario de redacción en un modal
 * (Dialog de Base UI). Se cierra automáticamente al enviar con éxito.
 */
export function NewAnnouncementDialog({
  professors,
  students,
}: {
  professors: AdminUser[];
  students: AdminUser[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" /> Nuevo aviso
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo aviso</DialogTitle>
            <DialogDescription>
              Envía una notificación a un docente o estudiante, a varios, o a
              todos a la vez. La recibirán en su centro de notificaciones.
            </DialogDescription>
          </DialogHeader>
          <NotificationComposeForm
            professors={professors}
            students={students}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
