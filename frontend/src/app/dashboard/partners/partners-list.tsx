"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/admin/delete-button";
import type { AdminPartner } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import {
  deletePartnerAction,
  reorderPartnersAction,
} from "@/app/dashboard/partners/actions";
import { EditPartnerButton } from "@/app/dashboard/partners/partner-dialogs";

function signature(items: AdminPartner[]): string {
  return items.map((p) => p.id).join("|");
}

/**
 * Tabla de instituciones aliadas con reordenamiento por drag-and-drop. El orden
 * de las filas (y por tanto de la landing) se persiste vía
 * `reorderPartnersAction`. El estado local se sincroniza con el servidor
 * comparando una firma durante el render.
 */
export function PartnersList({ partners }: { partners: AdminPartner[] }) {
  const router = useRouter();

  const [items, setItems] = useState(partners);
  const [prevSig, setPrevSig] = useState(() => signature(partners));
  const incoming = signature(partners);
  if (incoming !== prevSig) {
    setPrevSig(incoming);
    setItems(partners);
  }

  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    const prev = items;
    setItems(next);
    startTransition(async () => {
      const result = await reorderPartnersAction(next.map((i) => i.id));
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error);
        setItems(prev); // revertir
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border bg-card p-10 text-center text-muted-foreground shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        Aún no hay instituciones. Crea la primera.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="w-20">Logo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((partner) => (
                <PartnerRow key={partner.id} partner={partner} />
              ))}
            </TableBody>
          </Table>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function PartnerRow({ partner }: { partner: AdminPartner }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: partner.id });

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "relative z-10 bg-card shadow-lg")}
    >
      <TableCell>
        <button
          type="button"
          className="flex size-8 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label="Arrastrar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>
      <TableCell>
        <div className="flex size-12 items-center justify-center rounded-md bg-transparent p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={partner.logoUrl}
            alt={partner.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </TableCell>
      <TableCell className="font-medium">{partner.name}</TableCell>
      <TableCell>
        {partner.isPublished ? (
          <Badge>Publicado</Badge>
        ) : (
          <Badge variant="secondary">Oculto</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <EditPartnerButton partner={partner} />
          <DeleteButton
            action={deletePartnerAction.bind(null, partner.id)}
            confirmMessage={`¿Eliminar "${partner.name}"?`}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
