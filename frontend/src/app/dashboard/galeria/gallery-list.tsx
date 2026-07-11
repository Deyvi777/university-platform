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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import type { AdminGalleryItem } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import {
  deleteGalleryItemAction,
  reorderGalleryAction,
  updateGalleryItemAction,
} from "@/app/dashboard/galeria/actions";

function signature(items: AdminGalleryItem[]): string {
  return items.map((i) => i.id).join("|");
}

/**
 * Cuadrícula de fotos/videos de la galería con reordenamiento por
 * drag-and-drop (mismo patrón optimista de `partners-list.tsx`: estado local
 * sincronizado con el servidor comparando una firma durante el render). El
 * orden de las tarjetas es el orden del carrusel en la landing.
 */
export function GalleryList({ items: serverItems }: { items: AdminGalleryItem[] }) {
  const router = useRouter();

  const [items, setItems] = useState(serverItems);
  const [prevSig, setPrevSig] = useState(() => signature(serverItems));
  const incoming = signature(serverItems);
  if (incoming !== prevSig) {
    setPrevSig(incoming);
    setItems(serverItems);
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
      const result = await reorderGalleryAction(next.map((i) => i.id));
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
        Aún no hay fotos ni videos. Sube el primero.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={rectSortingStrategy}
      >
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item, index) => (
            <GalleryCard key={item.id} item={item} position={index + 1} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function GalleryCard({
  item,
  position,
}: {
  item: AdminGalleryItem;
  position: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  function togglePublished() {
    startTransition(async () => {
      const result = await updateGalleryItemAction(item.id, {
        isPublished: !item.isPublished,
      });
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group overflow-hidden rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none",
        isDragging && "relative z-10 shadow-lg",
      )}
    >
      <div className="relative aspect-[4/3] bg-muted">
        {item.type === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.title ?? `Foto ${position} de la galería`}
            className="size-full object-cover"
          />
        ) : (
          <>
            <video
              src={item.url}
              preload="metadata"
              muted
              playsInline
              className="size-full object-cover"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-black/55 text-white">
                <Play className="size-5 fill-current" aria-hidden="true" />
              </span>
            </span>
          </>
        )}

        <button
          type="button"
          className="absolute left-2 top-2 flex size-8 cursor-grab touch-none items-center justify-center rounded-md bg-black/45 text-white/90 hover:bg-black/65 active:cursor-grabbing"
          aria-label="Arrastrar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">
          #{position}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 p-2.5">
        <Badge variant={item.type === "IMAGE" ? "secondary" : "outline"}>
          {item.type === "IMAGE" ? "Foto" : "Video"}
        </Badge>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={togglePublished}
            disabled={pending}
            aria-label={
              item.isPublished ? "Ocultar de la landing" : "Publicar en la landing"
            }
            title={item.isPublished ? "Visible en la landing" : "Oculto"}
            className={cn(!item.isPublished && "text-muted-foreground")}
          >
            {item.isPublished ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4" />
            )}
          </Button>
          <DeleteButton
            action={deleteGalleryItemAction.bind(null, item.id)}
            title="¿Eliminar de la galería?"
            confirmMessage={`Se eliminará ${item.type === "IMAGE" ? "esta foto" : "este video"} de la galería de la landing.`}
          />
        </div>
      </div>
    </div>
  );
}
