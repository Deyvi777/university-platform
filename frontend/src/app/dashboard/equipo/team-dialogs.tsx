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
import type { AdminTeamMember } from "@/lib/api/admin";
import { TeamMemberForm } from "@/app/dashboard/equipo/team-form";

/** Botón "Nuevo integrante" que abre el formulario en un modal. */
export function CreateTeamMemberButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Nuevo integrante
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo integrante</DialogTitle>
            <DialogDescription>
              Integrante del equipo que se muestra en la landing.
            </DialogDescription>
          </DialogHeader>
          <TeamMemberForm
            variant="dialog"
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Botón (lápiz) que abre el formulario de edición de un integrante en un modal. */
export function EditTeamMemberButton({ member }: { member: AdminTeamMember }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label={`Editar ${member.name}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar integrante</DialogTitle>
            <DialogDescription>{member.name}</DialogDescription>
          </DialogHeader>
          <TeamMemberForm
            member={member}
            variant="dialog"
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
