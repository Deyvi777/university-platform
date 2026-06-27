"use client";

import { useState } from "react";
import { GraduationCap, LayoutList } from "lucide-react";
import { ContentManager } from "./content-manager";
import { Gradebook } from "./gradebook";
import type { ModuleGradebook, TeacherContent } from "@/lib/api/teacher";
import { cn } from "@/lib/utils";

type Tab = "contenido" | "calificaciones";

/**
 * Espacio de trabajo del módulo del docente con dos pestañas: "Contenido"
 * (temario / `ContentManager`) y "Calificaciones" (`Gradebook`).
 */
export function ModuleWorkspace({
  moduleId,
  contents,
  gradebook,
  readOnly = false,
}: {
  moduleId: string;
  contents: TeacherContent[];
  gradebook: ModuleGradebook | null;
  /** Módulo concluido (FINISHED): todo en solo lectura. */
  readOnly?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("contenido");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Vistas del módulo"
        className="inline-flex rounded-xl border bg-muted/40 p-1"
      >
        <TabButton
          active={tab === "contenido"}
          onClick={() => setTab("contenido")}
          icon={<LayoutList className="size-4" />}
        >
          Contenido
        </TabButton>
        <TabButton
          active={tab === "calificaciones"}
          onClick={() => setTab("calificaciones")}
          icon={<GraduationCap className="size-4" />}
        >
          Calificaciones
        </TabButton>
      </div>

      <div className="mt-5">
        {tab === "contenido" ? (
          <ContentManager
            moduleId={moduleId}
            contents={contents}
            readOnly={readOnly}
          />
        ) : (
          <Gradebook
            moduleId={moduleId}
            gradebook={gradebook}
            readOnly={readOnly}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </button>
  );
}
