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
import type { AdminCategory } from "@/lib/api/admin";
import { CategoryForm } from "@/app/dashboard/categorias/category-form";

/** Botón "Nueva categoría" que abre el formulario en un modal. */
export function CreateCategoryButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Nueva categoría
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
            <DialogDescription>
              Tipo de programa para clasificar la oferta académica.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            variant="dialog"
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Botón (lápiz) que abre el formulario de edición de una categoría en un modal. */
export function EditCategoryButton({ category }: { category: AdminCategory }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label={`Editar ${category.name}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
            <DialogDescription>{category.name}</DialogDescription>
          </DialogHeader>
          <CategoryForm
            category={category}
            variant="dialog"
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
