"use client";

import { Pencil, Plus } from "lucide-react";
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
import { UserForm } from "@/app/dashboard/usuarios/user-form";
import type { UserFormRole } from "@/app/dashboard/usuarios/user-schema";

const CREATE_TITLE: Record<UserFormRole, string> = {
  PROFESSOR: "Crear docente",
  STUDENT: "Crear estudiante",
};

/** Sustantivo del rol para los títulos de edición. */
function nounForRole(role: AdminUser["role"]): string {
  if (role === "ADMIN") return "administrativo";
  if (role === "PROFESSOR") return "docente";
  return "estudiante";
}

/**
 * Botón que abre el formulario de creación en un popup (Dialog de Base UI),
 * igual que los formularios del docente. El rol queda fijado por `defaultRole`
 * (la sección desde la que se crea).
 */
export function CreateUserButton({
  defaultRole,
  label,
  size,
}: {
  defaultRole: UserFormRole;
  label: string;
  size?: "sm";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size={size} onClick={() => setOpen(true)}>
        <Plus className="size-4" /> {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{CREATE_TITLE[defaultRole]}</DialogTitle>
            <DialogDescription>
              Recibirá acceso con el correo y la contraseña que definas.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            defaultRole={defaultRole}
            variant="dialog"
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Botón (lápiz) que abre el formulario de edición de un usuario en un popup.
 * El rol no se edita: el backend lo conserva (update parcial).
 */
export function EditUserButton({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const noun = nounForRole(user.role);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label={`Editar ${user.firstName} ${user.lastName}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar {noun}</DialogTitle>
            <DialogDescription>
              {user.firstName} {user.lastName} · {user.email}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            user={user}
            variant="dialog"
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
