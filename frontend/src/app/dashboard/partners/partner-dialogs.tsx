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
import type { AdminPartner } from "@/lib/api/admin";
import { PartnerForm } from "@/app/dashboard/partners/partner-form";

/** Botón "Nueva institución" que abre el formulario en un modal. */
export function CreatePartnerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Nueva institución
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva institución</DialogTitle>
            <DialogDescription>
              Institución aliada que se muestra en la landing.
            </DialogDescription>
          </DialogHeader>
          <PartnerForm
            variant="dialog"
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Botón (lápiz) que abre el formulario de edición de una institución en un modal. */
export function EditPartnerButton({ partner }: { partner: AdminPartner }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label={`Editar ${partner.name}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar institución</DialogTitle>
            <DialogDescription>{partner.name}</DialogDescription>
          </DialogHeader>
          <PartnerForm
            partner={partner}
            variant="dialog"
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
