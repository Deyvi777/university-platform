"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  GraduationCap,
  Loader2,
  Presentation,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminUser } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import {
  sendNotificationAction,
  type NotificationAudience,
} from "./actions";

const TITLE_MAX = 120;
const BODY_MAX = 2000;

type AudienceOption = {
  value: NotificationAudience;
  label: string;
  description: string;
};

export function NotificationComposeForm({
  professors,
  students,
  onSuccess,
  onCancel,
}: {
  professors: AdminUser[];
  students: AdminUser[];
  /** Se llama tras enviar el aviso con éxito (p. ej. para cerrar el modal). */
  onSuccess?: () => void;
  /** Si se pasa, muestra un botón Cancelar que lo invoca (cierra el modal). */
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [audience, setAudience] = useState<NotificationAudience>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const allUsers = useMemo(
    () => [...professors, ...students],
    [professors, students],
  );

  const audienceOptions: AudienceOption[] = [
    {
      value: "ALL",
      label: "Todos",
      description: `Docentes y estudiantes (${allUsers.length})`,
    },
    {
      value: "PROFESSORS",
      label: "Docentes",
      description: `Todos los docentes (${professors.length})`,
    },
    {
      value: "STUDENTS",
      label: "Estudiantes",
      description: `Todos los estudiantes (${students.length})`,
    },
    {
      value: "SELECTED",
      label: "Seleccionar",
      description: "Elige usuarios específicos",
    },
  ];

  const recipientCount =
    audience === "ALL"
      ? allUsers.length
      : audience === "PROFESSORS"
        ? professors.length
        : audience === "STUDENTS"
          ? students.length
          : selectedIds.size;

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q),
    );
  }, [allUsers, query]);

  function toggleUser(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Completa el título y el mensaje");
      return;
    }
    if (audience === "SELECTED" && selectedIds.size === 0) {
      toast.error("Selecciona al menos un destinatario");
      return;
    }

    startTransition(async () => {
      const result = await sendNotificationAction({
        audience,
        userIds: audience === "SELECTED" ? [...selectedIds] : undefined,
        title: title.trim(),
        body: body.trim(),
      });
      if (result.ok) {
        const n = result.data.count;
        toast.success(
          `Aviso enviado a ${n} ${n === 1 ? "persona" : "personas"}`,
        );
        setTitle("");
        setBody("");
        setSelectedIds(new Set());
        setQuery("");
        router.refresh(); // refresca el historial de avisos enviados
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Destinatarios */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <h2 className="text-sm font-semibold">Destinatarios</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ¿A quién se enviará este aviso?
        </p>

        <div
          role="radiogroup"
          aria-label="Destinatarios"
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          {audienceOptions.map((opt) => {
            const active = audience === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setAudience(opt.value)}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50",
                  active
                    ? "border-sky-300 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-500/10"
                    : "hover:bg-muted/50",
                )}
              >
                <span className="text-sm font-semibold text-foreground">
                  {opt.label}
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Lista de usuarios cuando se eligen específicos */}
        {audience === "SELECTED" && (
          <div className="mt-4 rounded-xl border bg-muted/30 p-3">
            {allUsers.length === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                No hay docentes ni estudiantes registrados.
              </p>
            ) : (
              <>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nombre o correo…"
                    className="pl-9"
                    aria-label="Buscar destinatarios"
                  />
                </div>
                <p className="mt-2 px-1 text-xs text-muted-foreground">
                  {selectedIds.size} seleccionado
                  {selectedIds.size === 1 ? "" : "s"}
                </p>
                <ul className="mt-1 max-h-72 space-y-0.5 overflow-auto">
                  {filteredUsers.map((u) => {
                    const checked = selectedIds.has(u.id);
                    return (
                      <li key={u.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-lg border px-2.5 py-2 transition-colors",
                            checked
                              ? "border-sky-300 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-500/10"
                              : "border-transparent hover:bg-background",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="size-4 shrink-0 accent-sky-500"
                            checked={checked}
                            onChange={() => toggleUser(u.id)}
                          />
                          <UserRow user={u} />
                          {checked && (
                            <Check
                              className="ml-auto size-4 shrink-0 text-sky-600 dark:text-sky-400"
                              aria-hidden="true"
                            />
                          )}
                        </label>
                      </li>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <li className="px-1 py-6 text-center text-sm text-muted-foreground">
                      Sin coincidencias para «{query}».
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>
        )}
      </section>

      {/* Mensaje */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <h2 className="text-sm font-semibold">Mensaje</h2>

        <div className="mt-4">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            placeholder="Ej. Recordatorio de inicio de clases"
            className="mt-1.5"
            maxLength={TITLE_MAX}
          />
        </div>

        <div className="mt-4">
          <Label htmlFor="body">Mensaje</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
            placeholder="Escribe el contenido del aviso…"
            className="mt-1.5 min-h-32"
            maxLength={BODY_MAX}
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {body.length}/{BODY_MAX}
          </p>
        </div>
      </section>

      {/* Acción */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Se enviará a{" "}
          <span className="font-semibold text-foreground">
            {recipientCount}
          </span>{" "}
          {recipientCount === 1 ? "persona" : "personas"}.
        </p>
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isPending || recipientCount === 0}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            Enviar aviso
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Fila de usuario: avatar de iniciales + nombre/correo + badge de rol. */
function UserRow({ user }: { user: AdminUser }) {
  const initials = `${user.firstName} ${user.lastName}`
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const isProfessor = user.role === "PROFESSOR";

  return (
    <span className="flex min-w-0 flex-1 items-center gap-2.5">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-950 text-[0.7rem] font-bold text-amber-300"
        aria-hidden="true"
      >
        {initials}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">
            {user.firstName} {user.lastName}
          </span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.65rem] font-medium",
              isProfessor
                ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                : "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
            )}
          >
            {isProfessor ? (
              <Presentation className="size-3" aria-hidden="true" />
            ) : (
              <GraduationCap className="size-3" aria-hidden="true" />
            )}
            {isProfessor ? "Docente" : "Estudiante"}
          </span>
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {user.email}
        </span>
      </span>
    </span>
  );
}
