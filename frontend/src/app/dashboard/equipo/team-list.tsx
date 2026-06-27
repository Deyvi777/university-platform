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
import { DeleteButton } from "@/components/admin/delete-button";
import type { AdminTeamMember } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import {
  deleteTeamMemberAction,
  reorderTeamAction,
} from "@/app/dashboard/equipo/actions";
import { EditTeamMemberButton } from "@/app/dashboard/equipo/team-dialogs";

function signature(members: AdminTeamMember[]): string {
  return members.map((m) => m.id).join("|");
}

export function TeamList({ team }: { team: AdminTeamMember[] }) {
  const router = useRouter();

  // Estado local de orden (drag-and-drop optimista). Se sincroniza con el
  // servidor comparando una firma durante el render (patrón recomendado por
  // React: guardar el valor previo en estado, no en un ref ni en useEffect).
  const [items, setItems] = useState(team);
  const [prevSig, setPrevSig] = useState(() => signature(team));
  const incoming = signature(team);
  if (incoming !== prevSig) {
    setPrevSig(incoming);
    setItems(team);
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
      const result = await reorderTeamAction(next.map((i) => i.id));
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
        Aún no hay integrantes. Crea el primero.
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
          <ul className="divide-y">
            {items.map((member) => (
              <TeamRow key={member.id} member={member} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function TeamRow({ member }: { member: AdminTeamMember }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 bg-card px-3 py-3 sm:px-4",
        isDragging && "relative z-10 shadow-lg",
      )}
    >
      <button
        type="button"
        className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={member.photoUrl}
          alt={member.name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{member.name}</p>
        <p className="truncate text-sm text-muted-foreground">{member.role}</p>
      </div>

      {member.isPublished ? (
        <Badge className="shrink-0 border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          Activo
        </Badge>
      ) : (
        <Badge variant="secondary" className="shrink-0">
          Inactivo
        </Badge>
      )}

      <div className="flex shrink-0 items-center gap-1">
        <EditTeamMemberButton member={member} />
        <DeleteButton
          action={deleteTeamMemberAction.bind(null, member.id)}
          confirmMessage={`¿Eliminar a "${member.name}"?`}
        />
      </div>
    </li>
  );
}
