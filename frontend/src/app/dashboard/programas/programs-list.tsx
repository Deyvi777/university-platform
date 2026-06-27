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
import { GripVertical, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/admin/delete-button";
import type { AdminProgramListItem } from "@/lib/api/admin";
import { formatStartDate } from "@/lib/api/programs";
import { cn } from "@/lib/utils";
import {
  deleteProgramAction,
  reorderProgramsAction,
} from "@/app/dashboard/programas/actions";

function signature(items: AdminProgramListItem[]): string {
  return items.map((p) => p.id).join("|");
}

/**
 * Tabla de programas (oferta de la landing) con reordenamiento por
 * drag-and-drop. El orden de las filas se persiste vía `reorderProgramsAction`
 * y es el mismo que se muestra en la landing. El estado local se sincroniza con
 * el servidor comparando una firma durante el render.
 */
export function ProgramsList({
  programs,
}: {
  programs: AdminProgramListItem[];
}) {
  const router = useRouter();

  const [items, setItems] = useState(programs);
  const [prevSig, setPrevSig] = useState(() => signature(programs));
  const incoming = signature(programs);
  if (incoming !== prevSig) {
    setPrevSig(incoming);
    setItems(programs);
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
      const result = await reorderProgramsAction(next.map((i) => i.id));
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
        Aún no hay programas. Crea el primero.
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
                <TableHead>Título</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((program) => (
                <ProgramRow key={program.id} program={program} />
              ))}
            </TableBody>
          </Table>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function ProgramRow({ program }: { program: AdminProgramListItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: program.id });

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
      <TableCell className="font-medium">{program.title}</TableCell>
      <TableCell>{program.category.name}</TableCell>
      <TableCell>{formatStartDate(program.startDate)}</TableCell>
      <TableCell>
        {program.isPublished ? (
          <Badge>Publicado</Badge>
        ) : (
          <Badge variant="secondary">Borrador</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            nativeButton={false}
            render={
              <Link
                href={`/dashboard/programas/${program.id}`}
                aria-label="Editar"
              />
            }
            variant="ghost"
            size="icon-sm"
          >
            <Pencil className="size-4" />
          </Button>
          <DeleteButton
            action={deleteProgramAction.bind(null, program.id)}
            confirmMessage={`¿Eliminar "${program.title}"? Esta acción no se puede deshacer.`}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
