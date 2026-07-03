"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Loader2, MessageSquare, Send, UserRound } from "lucide-react";
import { toast } from "sonner";
import type { ChatContact, ChatMessage } from "@/lib/api/chat";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** El "otro" extremo de un mensaje desde la perspectiva del usuario actual. */
function counterpartOf(msg: ChatMessage, currentUserId: string): string {
  return msg.studentId === currentUserId ? msg.teacherId : msg.studentId;
}

function fullName(c: { firstName: string; lastName: string }): string {
  return `${c.lastName} ${c.firstName}`.trim();
}

function initials(c: { firstName: string; lastName: string }): string {
  return `${c.lastName.charAt(0)}${c.firstName.charAt(0)}`.toUpperCase();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
}

/** Estado del chat de un módulo (lo expone `useModuleChat`). */
export interface ModuleChatState {
  contacts: ChatContact[];
  selectedId: string | null;
  selectedContact: ChatContact | null;
  messages: ChatMessage[];
  loadingHistory: boolean;
  connected: boolean;
  /** Cantidad de contactos con mensajes sin leer (para el badge de la pestaña). */
  unreadCount: number;
  currentUserId: string;
  selectContact: (id: string) => void;
  sendMessage: (body: string) => Promise<{ ok: boolean; error?: string }>;
}

/**
 * Hook del chat en tiempo real docente ↔ estudiante de un módulo (mensajería 1 a
 * 1). Mantiene la conexión WebSocket (socket.io, namespace `/chat`), la lista de
 * contactos con sus no leídos y la conversación seleccionada. **Lo llama el
 * componente padre (la vista del módulo)**, no la pestaña, para que el contador
 * de no leídos se actualice en vivo aunque el chat no esté abierto — igual que la
 * campana de notificaciones (push por WS, sin polling).
 */
export function useModuleChat({
  moduleId,
  currentUserId,
  token,
  contacts: initialContacts,
  initialContactId,
  active,
  enabled = true,
}: {
  moduleId: string;
  currentUserId: string;
  token: string;
  contacts: ChatContact[];
  initialContactId?: string;
  /** La pestaña del chat está visible ahora mismo (no solo montada). */
  active: boolean;
  /** Si es `false`, el chat no se usa (p. ej. el admin): no abre socket. */
  enabled?: boolean;
}): ModuleChatState {
  const [contacts, setContacts] = useState<ChatContact[]>(initialContacts);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (
      initialContactId &&
      initialContacts.some((c) => c.id === initialContactId)
    ) {
      return initialContactId;
    }
    return initialContacts.length === 1 ? initialContacts[0].id : null;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const selectedIdRef = useRef<string | null>(selectedId);
  const activeRef = useRef(active);

  // Mantiene los refs sincronizados (los lee el handler de `chat:new`, que se
  // registra una sola vez). Escribir el ref va en effect.
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Conexión WebSocket: una sola mientras el módulo esté abierto. Escucha
  // `chat:new` y enruta el mensaje a la conversación abierta o suma a los no
  // leídos del contacto.
  useEffect(() => {
    if (!enabled) return;
    const socket = io(`${API_URL}/chat`, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("chat:new", (msg: ChatMessage) => {
      if (msg.moduleId !== moduleId) return;
      const other = counterpartOf(msg, currentUserId);
      const isSelected = other === selectedIdRef.current;
      // "Viendo" = la pestaña del chat está activa Y es la conversación abierta.
      // Estar solo seleccionada (p. ej. el único docente) pero en otra pestaña
      // NO cuenta como leído: debe marcar el badge.
      const viewing = activeRef.current && isSelected;
      if (viewing) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
        );
      }
      // No leídos: mensaje entrante que el usuario no está viendo ahora mismo.
      if (!viewing && msg.senderId !== currentUserId) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === other ? { ...c, unread: c.unread + 1 } : c,
          ),
        );
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [moduleId, currentUserId, token, enabled]);

  async function loadHistory(id: string) {
    setLoadingHistory(true);
    try {
      const res = await fetch(
        `${API_URL}/me/chat/${encodeURIComponent(
          moduleId,
        )}/contacts/${encodeURIComponent(id)}/messages`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error();
      const history = (await res.json()) as ChatMessage[];
      // Evita pisar una conversación que el usuario ya cambió.
      if (selectedIdRef.current === id) setMessages(history);
    } catch {
      toast.error("No se pudo cargar la conversación");
    } finally {
      setLoadingHistory(false);
    }
  }

  // Marca una conversación como "vista": limpia su badge (optimista) y trae el
  // historial (el backend la marca leída y avisa a la campana por WS).
  function markViewed(id: string) {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    );
    void loadHistory(id);
  }

  function selectContact(id: string) {
    setSelectedId(id);
    selectedIdRef.current = id;
    setMessages([]);
    markViewed(id);
  }

  // Marca como vista la conversación seleccionada SOLO cuando la pestaña del chat
  // se muestra. Si el chat no está activo (el usuario está en otra pestaña), no
  // se carga ni se marca leída → un mensaje entrante conserva su badge hasta que
  // el usuario abra realmente el chat.
  useEffect(() => {
    if (enabled && active && selectedIdRef.current) {
      markViewed(selectedIdRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, enabled]);

  // Deep-link en caliente: si `initialContactId` cambia con el módulo ya montado
  // (abrir otra conversación desde una notificación sin recargar), seleccionamos
  // ese contacto. En el montaje no hace nada (ya es el inicial).
  useEffect(() => {
    if (
      enabled &&
      initialContactId &&
      initialContactId !== selectedIdRef.current &&
      contacts.some((c) => c.id === initialContactId)
    ) {
      selectContact(initialContactId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContactId, enabled]);

  function sendMessage(
    body: string,
  ): Promise<{ ok: boolean; error?: string }> {
    return new Promise((resolve) => {
      const trimmed = body.trim();
      const socket = socketRef.current;
      const to = selectedIdRef.current;
      if (!trimmed || !to || !socket) {
        resolve({ ok: false, error: "No hay conversación seleccionada" });
        return;
      }
      socket.emit(
        "chat:send",
        { moduleId, toUserId: to, body: trimmed },
        (ack: { ok: boolean; error?: string }) =>
          resolve(ack ?? { ok: false, error: "Sin respuesta del servidor" }),
      );
    });
  }

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedId) ?? null,
    [contacts, selectedId],
  );
  // Personas con al menos un mensaje sin leer (no el total de mensajes).
  const unreadCount = useMemo(
    () => contacts.reduce((acc, c) => acc + (c.unread > 0 ? 1 : 0), 0),
    [contacts],
  );

  return {
    contacts,
    selectedId,
    selectedContact,
    messages,
    loadingHistory,
    connected,
    unreadCount,
    currentUserId,
    selectContact,
    sendMessage,
  };
}

/**
 * Vista del chat (presentacional): consume el estado de `useModuleChat`. `compact`
 * usa un selector de contacto arriba en lugar de dos columnas (panel angosto del
 * aula); el modo completo (docente) muestra la lista de contactos a la izquierda.
 */
export function ModuleChat({
  chat,
  contactNoun,
  emptyText,
  compact = false,
}: {
  chat: ModuleChatState;
  /** "docente" (vista estudiante) o "estudiante" (vista docente). */
  contactNoun: string;
  /** Texto cuando no hay contactos disponibles. */
  emptyText: string;
  compact?: boolean;
}) {
  const {
    contacts,
    selectedId,
    selectedContact,
    messages,
    loadingHistory,
    connected,
    currentUserId,
    selectContact,
    sendMessage,
  } = chat;

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Autoscroll al fondo cuando cambian los mensajes.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send() {
    const body = draft.trim();
    if (!body || !selectedContact) return;
    setSending(true);
    const ack = await sendMessage(body);
    setSending(false);
    if (ack.ok) setDraft("");
    else toast.error(ack.error ?? "No se pudo enviar el mensaje");
  }

  if (contacts.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <span
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          <MessageSquare className="size-6" />
        </span>
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  const conversation = (
    <div className="flex h-full min-h-0 flex-col">
      {/* Encabezado de la conversación */}
      {selectedContact ? (
        <div className="flex items-center gap-2.5 border-b px-4 py-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            aria-hidden="true"
          >
            {initials(selectedContact)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {fullName(selectedContact)}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-block size-1.5 rounded-full",
                  connected ? "bg-emerald-500" : "bg-muted-foreground/40",
                )}
                aria-hidden="true"
              />
              {connected ? "En línea" : "Conectando…"}
            </p>
          </div>
        </div>
      ) : null}

      {/* Mensajes */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4"
      >
        {!selectedContact ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Selecciona un {contactNoun} para conversar.
          </p>
        ) : loadingHistory ? (
          <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Cargando…
          </p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No hay mensajes todavía. ¡Escribe el primero!
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                    mine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-right text-[0.65rem] tabular-nums",
                      mine
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Compositor */}
      <div className="border-t p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            disabled={!selectedContact}
            rows={1}
            placeholder={
              selectedContact
                ? "Escribe un mensaje…"
                : `Selecciona un ${contactNoun}…`
            }
            className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm shadow-sm focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!selectedContact || !draft.trim() || sending}
            aria-label="Enviar mensaje"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );

  // Layout compacto (panel angosto del aula): selector de contacto arriba.
  if (compact) {
    return (
      <div className="flex h-[32rem] flex-col">
        <div className="flex flex-wrap gap-1.5 border-b p-3">
          {contacts.map((c) => {
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectContact(c.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted/70",
                )}
              >
                {fullName(c)}
                {c.unread > 0 && (
                  <span
                    className={cn(
                      "flex min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] font-bold",
                      active
                        ? "bg-primary-foreground/25 text-primary-foreground"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {c.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="min-h-0 flex-1">{conversation}</div>
      </div>
    );
  }

  // Layout completo (panel del docente): lista de contactos + conversación.
  return (
    <div className="grid h-[34rem] grid-cols-[minmax(0,16rem)_1fr] overflow-hidden rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
      <div className="flex flex-col border-r">
        <p className="border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {contactNoun === "estudiante" ? "Estudiantes" : "Docentes"}
        </p>
        <ul className="flex-1 overflow-y-auto p-2">
          {contacts.map((c) => {
            const active = c.id === selectedId;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => selectContact(c.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                    active ? "bg-primary/10" : "hover:bg-muted/60",
                  )}
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
                    aria-hidden="true"
                  >
                    {initials(c) || <UserRound className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm",
                        active ? "font-semibold text-primary" : "font-medium",
                      )}
                    >
                      {fullName(c)}
                    </span>
                  </span>
                  {c.unread > 0 && (
                    <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.65rem] font-bold text-primary-foreground">
                      {c.unread}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="min-h-0">{conversation}</div>
    </div>
  );
}

/** Badge ámbar (estilo campana) con la cantidad de chats sin leer, para la
 * pestaña "Chat". No renderiza nada si `count` es 0. */
export function ChatTabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="ml-1 flex min-w-[1.1rem] items-center justify-center rounded-full bg-amber-400 px-1 text-[0.65rem] font-bold leading-[1.1rem] text-blue-950"
      aria-label={`${count} sin leer`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
