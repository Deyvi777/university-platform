"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CornerDownRight,
  Loader2,
  MessageSquarePlus,
  MessagesSquare,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ForumPost, ForumThread as ForumThreadData } from "@/lib/api/me";
import { cn } from "@/lib/utils";

function initials(first: string, last: string): string {
  return `${last.charAt(0)}${first.charAt(0)}`.toUpperCase();
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-BO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Hilo de discusión público de una actividad de tipo FORUM. Lo usan tanto el
 * estudiante (aula) como el docente (página de calificación). Lee/escribe vía
 * los route handlers `/api/me/forum/*` con React Query.
 */
export function ForumThread({ activityId }: { activityId: string }) {
  const qc = useQueryClient();
  const queryKey = ["me-forum", activityId];

  const { data, isLoading, isError } = useQuery<ForumThreadData>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/me/forum/${activityId}`);
      if (!res.ok) throw new Error("No se pudo cargar el foro");
      return res.json();
    },
  });

  const createMut = useMutation({
    mutationFn: async (vars: { body: string; parentId?: string | null }) => {
      const res = await fetch(`/api/me/forum/${activityId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(msg.message ?? "No se pudo publicar");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (vars: { postId: string; body: string }) => {
      const res = await fetch(`/api/me/forum/posts/${vars.postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: vars.body }),
      });
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(msg.message ?? "No se pudo editar");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/me/forum/posts/${postId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(msg.message ?? "No se pudo borrar");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Cargando foro…
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        No se pudo cargar el foro.
      </div>
    );
  }

  const roots = data.posts.filter((p) => p.parentId === null);
  const repliesOf = (id: string) =>
    data.posts.filter((p) => p.parentId === id);
  const canPost = data.canPost;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-background p-3.5">
        <div className="flex items-center gap-2">
          <span
            className="flex size-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
            aria-hidden="true"
          >
            <MessagesSquare className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">{data.activity.title}</p>
            <p className="text-xs text-muted-foreground">
              Foro de discusión · {data.posts.length}{" "}
              {data.posts.length === 1 ? "mensaje" : "mensajes"}
            </p>
          </div>
        </div>
        {data.activity.instructions && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {data.activity.instructions}
          </p>
        )}
      </div>

      {/* Nuevo mensaje raíz */}
      {canPost ? (
        <Composer
          placeholder="Escribe un mensaje para el foro…"
          submitLabel="Publicar"
          pending={createMut.isPending}
          onSubmit={(body) => createMut.mutate({ body })}
        />
      ) : (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          El módulo está concluido: el foro es de solo lectura.
        </p>
      )}

      {/* Hilo */}
      {roots.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Todavía no hay mensajes. ¡Sé el primero en participar!
        </p>
      ) : (
        <ul className="space-y-3">
          {roots.map((post) => (
            <li key={post.id}>
              <PostCard
                post={post}
                canReply={canPost}
                onReply={(body) =>
                  createMut.mutate({ body, parentId: post.id })
                }
                onEdit={(body) => updateMut.mutate({ postId: post.id, body })}
                onDelete={() => deleteMut.mutate(post.id)}
                busy={createMut.isPending || updateMut.isPending}
              />
              {/* Respuestas indentadas */}
              {repliesOf(post.id).length > 0 && (
                <ul className="mt-2 space-y-2 border-l-2 border-muted pl-4">
                  {repliesOf(post.id).map((reply) => (
                    <li key={reply.id}>
                      <PostCard
                        post={reply}
                        canReply={false}
                        onEdit={(body) =>
                          updateMut.mutate({ postId: reply.id, body })
                        }
                        onDelete={() => deleteMut.mutate(reply.id)}
                        busy={updateMut.isPending}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PostCard({
  post,
  canReply,
  onReply,
  onEdit,
  onDelete,
  busy,
}: {
  post: ForumPost;
  canReply: boolean;
  onReply?: (body: string) => void;
  onEdit: (body: string) => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold",
            post.isMine
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
          aria-hidden="true"
        >
          {initials(post.author.firstName, post.author.lastName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-medium">
              {post.author.lastName} {post.author.firstName}
            </span>
            <span className="text-[0.65rem] text-muted-foreground">
              {timeAgo(post.createdAt)}
              {post.edited && " · editado"}
            </span>
          </div>

          {editing ? (
            <div className="mt-1.5">
              <Composer
                initial={post.body}
                placeholder="Edita tu mensaje…"
                submitLabel="Guardar"
                pending={busy}
                onSubmit={(body) => {
                  onEdit(body);
                  setEditing(false);
                }}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : (
            <p className="mt-0.5 text-sm whitespace-pre-wrap text-foreground/90">
              {post.body}
            </p>
          )}

          {!editing && (
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
              {canReply && onReply && (
                <button
                  type="button"
                  onClick={() => setReplying((v) => !v)}
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <CornerDownRight className="size-3.5" /> Responder
                </button>
              )}
              {post.isMine && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Pencil className="size-3.5" /> Editar
                </button>
              )}
              {post.canDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-3.5" /> Borrar
                </button>
              )}
            </div>
          )}

          {replying && onReply && (
            <div className="mt-2">
              <Composer
                placeholder={`Responder a ${post.author.firstName}…`}
                submitLabel="Responder"
                pending={busy}
                onSubmit={(body) => {
                  onReply(body);
                  setReplying(false);
                }}
                onCancel={() => setReplying(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Composer({
  initial = "",
  placeholder,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: string;
  placeholder: string;
  submitLabel: string;
  pending: boolean;
  onSubmit: (body: string) => void;
  onCancel?: () => void;
}) {
  const [body, setBody] = useState(initial);

  function submit() {
    const trimmed = body.trim();
    if (!trimmed) {
      toast.error("Escribe un mensaje");
      return;
    }
    onSubmit(trimmed);
    if (!onCancel) setBody(""); // composer raíz: limpiar tras publicar
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        className="min-h-20 bg-background"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="size-4" /> Cancelar
          </Button>
        )}
        <Button type="button" size="sm" disabled={pending} onClick={submit}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : onCancel ? (
            <Send className="size-4" />
          ) : (
            <MessageSquarePlus className="size-4" />
          )}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
