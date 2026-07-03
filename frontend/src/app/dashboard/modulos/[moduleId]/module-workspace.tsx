"use client";

import { useState } from "react";
import { GraduationCap, LayoutList, MessageSquare } from "lucide-react";
import { ContentManager } from "./content-manager";
import { Gradebook } from "./gradebook";
import {
  ChatTabBadge,
  ModuleChat,
  useModuleChat,
} from "@/components/dashboard/module-chat";
import type { ChatContact } from "@/lib/api/chat";
import type { ModuleGradebook, TeacherContent } from "@/lib/api/teacher";
import { cn } from "@/lib/utils";

type Tab = "contenido" | "calificaciones" | "chat";

/** Datos para el chat del docente (estudiantes del curso + sesión). */
export interface WorkspaceChat {
  contacts: ChatContact[];
  currentUserId: string;
  token: string;
}

/**
 * Espacio de trabajo del módulo del docente con tres pestañas: "Contenido"
 * (temario / `ContentManager`), "Calificaciones" (`Gradebook`) y "Chat"
 * (mensajería con los estudiantes del curso).
 */
export function ModuleWorkspace({
  moduleId,
  contents,
  gradebook,
  readOnly = false,
  isAdmin = false,
  chat,
  initialChatContactId,
  openChat = false,
  showChat = true,
}: {
  moduleId: string;
  contents: TeacherContent[];
  gradebook: ModuleGradebook | null;
  /** Módulo concluido (FINISHED): todo en solo lectura. */
  readOnly?: boolean;
  /** El ADMIN además puede habilitar la segunda instancia del recuperatorio. */
  isAdmin?: boolean;
  chat: WorkspaceChat;
  /** Abrir directamente la pestaña Chat con este contacto (deep-link). */
  initialChatContactId?: string;
  /** Abrir la pestaña Chat aunque no haya contacto preseleccionado. */
  openChat?: boolean;
  /** Mostrar la pestaña Chat. El admin gestiona el módulo sin chat. */
  showChat?: boolean;
}) {
  const wantChat = showChat && (openChat || Boolean(initialChatContactId));
  const [tab, setTab] = useState<Tab>(wantChat ? "chat" : "contenido");

  // Deep-link "en caliente": si la URL pide el chat (`?chat=`) estando ya en
  // esta vista (mismo módulo, otra pestaña), el server re-renderiza con nuevos
  // props pero el estado del cliente persiste. Sincronizamos comparando con el
  // valor previo durante el render (patrón recomendado por React; no `useEffect`).
  const [prevWantChat, setPrevWantChat] = useState(wantChat);
  if (wantChat !== prevWantChat) {
    setPrevWantChat(wantChat);
    if (wantChat) setTab("chat");
  }

  // El chat vive en el padre (no en la pestaña) para que el contador de no
  // leídos se actualice en vivo aunque el docente esté en otra pestaña.
  const chatState = useModuleChat({
    moduleId,
    currentUserId: chat.currentUserId,
    token: chat.token,
    contacts: chat.contacts,
    initialContactId: initialChatContactId,
    active: showChat && tab === "chat",
    enabled: showChat,
  });

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
        {showChat && (
          <TabButton
            active={tab === "chat"}
            onClick={() => setTab("chat")}
            icon={<MessageSquare className="size-4" />}
          >
            Chat
            <ChatTabBadge count={chatState.unreadCount} />
          </TabButton>
        )}
      </div>

      <div className="mt-5">
        {tab === "contenido" ? (
          <ContentManager
            moduleId={moduleId}
            contents={contents}
            readOnly={readOnly}
            isAdmin={isAdmin}
            // Reprobados del módulo: habilita el recuperatorio/segunda instancia.
            // "Reprobado" = FAILED o nota por debajo del mínimo aunque siga
            // IN_PROGRESS (módulos concluidos con notas sin finalizar).
            failedCount={
              gradebook
                ? gradebook.students.filter((s) => {
                    const g = s.moduleGrade;
                    if (!g) return false;
                    return (
                      g.status === "FAILED" ||
                      (g.finalScore != null &&
                        g.finalScore < gradebook.course.passingScore)
                    );
                  }).length
                : 0
            }
          />
        ) : tab === "calificaciones" || !showChat ? (
          <Gradebook
            moduleId={moduleId}
            gradebook={gradebook}
            readOnly={readOnly}
          />
        ) : (
          <ModuleChat
            chat={chatState}
            contactNoun="estudiante"
            emptyText="No hay estudiantes inscritos en este curso todavía."
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
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
      )}
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </button>
  );
}
