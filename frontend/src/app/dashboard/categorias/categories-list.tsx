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
import type { AdminCategory } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import {
  deleteCategoryAction,
  reorderCategoriesAction,
} from "@/app/dashboard/categorias/actions";
import { EditCategoryButton } from "@/app/dashboard/categorias/category-dialogs";

function signature(items: AdminCategory[]): string {
  return items.map((c) => c.id).join("|");
}

/**
 * Tabla de categorías con reordenamiento por drag-and-drop. El orden de las
 * filas (y por tanto de la landing) se persiste vía `reorderCategoriesAction`.
 * El estado local se sincroniza con el servidor comparando una firma durante el
 * render (patrón recomendado por React: guardar el valor previo en estado).
 */
export function CategoriesList({
  categories,
}: {
  categories: AdminCategory[];
}) {
  const router = useRouter();

  const [items, setItems] = useState(categories);
  const [prevSig, setPrevSig] = useState(() => signature(categories));
  const incoming = signature(categories);
  if (incoming !== prevSig) {
    setPrevSig(incoming);
    setItems(categories);
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
      const result = await reorderCategoriesAction(next.map((i) => i.id));
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
        Aún no hay categorías. Crea la primera.
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
                <TableHead>Nombre</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Programas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))}
            </TableBody>
          </Table>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function CategoryRow({ category }: { category: AdminCategory }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

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
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell className="text-muted-foreground">{category.slug}</TableCell>
      <TableCell>{category._count?.programs ?? 0}</TableCell>
      <TableCell>
        {category.isActive ? (
          <Badge>Activa</Badge>
        ) : (
          <Badge variant="secondary">Inactiva</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <EditCategoryButton category={category} />
          <DeleteButton
            action={deleteCategoryAction.bind(null, category.id)}
            confirmMessage={`¿Eliminar la categoría "${category.name}"?`}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
