"use client";

import { useState, useTransition } from "react";
import {
  Award,
  Check,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  PlayCircle,
  ListVideo,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LessonVideo } from "@/components/dashboard/lesson-video";
import {
  ChatTabBadge,
  ModuleChat,
  useModuleChat,
} from "@/components/dashboard/module-chat";
import { RichTextContent } from "@/components/dashboard/rich-text-content";
import type { ChatContact } from "@/lib/api/chat";
import type {
  ContentKind,
  CourseActivity,
  LearnContent,
  LearnModule,
  ModuleGradeStatus,
  SubmissionStatus,
} from "@/lib/api/me";
import { cn } from "@/lib/utils";
import { StudentActivity } from "../../mis-cursos/[id]/student-activity";
import { setProgressAction } from "./actions";

type PanelTab = "temario" | "calificaciones" | "chat";

/** Datos para el chat del estudiante (docentes del módulo + sesión). */
export interface ClassroomChat {
  contacts: ChatContact[];
  currentUserId: string;
  token: string;
}

const KIND_ICON: Record<ContentKind, typeof FileText> = {
  TEXT: FileText,
  VIDEO: PlayCircle,
  MATERIAL: Paperclip,
  ACTIVITY: ClipboardList,
};

const KIND_LABEL: Record<ContentKind, string> = {
  TEXT: "Tema",
  VIDEO: "Video",
  MATERIAL: "Material",
  ACTIVITY: "Actividad",
};

/** Primer contenido sin completar, o el primero si todos están completos. */
function defaultContentId(contents: LearnContent[]): string | null {
  if (contents.length === 0) return null;
  const pending = contents.find((c) => !c.completed);
  return (pending ?? contents[0]).id;
}

/** Construye el objeto que espera `StudentActivity` a partir del contenido. */
function toActivity(c: LearnContent): CourseActivity {
  return {
    id: c.id,
    type: c.activityType ?? "ASSIGNMENT",
    title: c.title,
    instructions: c.instructions,
    dueDate: c.dueDate,
    maxScore: c.maxScore ?? 100,
    weight: c.weight ?? 0,
    submission: c.submission,
  };
}

export function ClassroomView({
  module: learn,
  chat,
  initialChatContactId,
  openChat = false,
  initialContentId,
}: {
  module: LearnModule;
  chat: ClassroomChat;
  /** Abrir directamente la pestaña Chat con este contacto (deep-link). */
  initialChatContactId?: string;
  /** Abrir la pestaña Chat aunque no haya contacto preseleccionado. */
  openChat?: boolean;
  /** Seleccionar este contenido al entrar (deep-link de una actividad). */
  initialContentId?: string;
}) {
  const { contents } = learn;
  const wantChat = openChat || Boolean(initialChatContactId);
  // Módulo concluido → aula en solo lectura (sin progreso, apuntes ni entregas).
  const readOnly = learn.status === "FINISHED";
  // Las actividades presenciales no son lecciones del temario; solo aparecen en
  // "Notas". El temario y el progreso se calculan sobre el resto.
  const temarioContents = contents.filter((c) => !c.isOffline);
  const hasGrades = contents.some((c) => c.kind === "ACTIVITY");
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    initialContentId && temarioContents.some((c) => c.id === initialContentId)
      ? initialContentId
      : defaultContentId(temarioContents),
  );
  const [tab, setTab] = useState<PanelTab>(
    wantChat
      ? "chat"
      : temarioContents.length === 0 && hasGrades
        ? "calificaciones"
        : "temario",
  );

  // Deep-link "en caliente": si la URL pide el chat (`?chat=`) o una actividad
  // (`?content=`) estando ya en esta vista (mismo módulo, otra pestaña), el
  // server re-renderiza con nuevos props pero el estado del cliente persiste.
  // Sincronizamos comparando con el valor previo durante el render (patrón
  // recomendado por React; no `useEffect`).
  const [prevWantChat, setPrevWantChat] = useState(wantChat);
  if (wantChat !== prevWantChat) {
    setPrevWantChat(wantChat);
    if (wantChat) setTab("chat");
  }
  const [prevContentId, setPrevContentId] = useState(initialContentId);
  if (initialContentId !== prevContentId) {
    setPrevContentId(initialContentId);
    if (
      initialContentId &&
      temarioContents.some((c) => c.id === initialContentId)
    ) {
      setSelectedId(initialContentId);
      setTab("temario");
    }
  }

  // El chat vive en el padre (no en la pestaña) para que el contador de no
  // leídos se actualice en vivo aunque el estudiante esté en otra pestaña.
  const chatState = useModuleChat({
    moduleId: learn.id,
    currentUserId: chat.currentUserId,
    token: chat.token,
    contacts: chat.contacts,
    initialContactId: initialChatContactId,
    active: tab === "chat",
  });

  const selected =
    temarioContents.find((c) => c.id === selectedId) ??
    temarioContents[0] ??
    null;

  // Nada en absoluto (ni lecciones ni actividades) → estado vacío completo.
  // Salvo que se entre directo al chat (deep-link), donde igual mostramos el
  // panel para poder conversar.
  if (!selected && !hasGrades && !wantChat) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-16 text-center">
        <span
          className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          <ListVideo className="size-7" />
        </span>
        <p className="mt-3 text-base font-medium text-foreground">
          Este módulo aún no tiene contenido publicado
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Vuelve más tarde: el docente todavía no ha publicado contenido.
        </p>
      </div>
    );
  }

  const completedCount = temarioContents.filter((c) => c.completed).length;
  const progress = temarioContents.length
    ? Math.round((completedCount / temarioContents.length) * 100)
    : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
      {/* Columna principal */}
      <div className="min-w-0">
        {selected ? (
          <>
            <ContentMain
              content={selected}
              courseName={learn.course.name}
              courseId={learn.course.id}
              readOnly={readOnly}
            />
            <ProgressButton
              moduleId={learn.id}
              content={selected}
              readOnly={readOnly}
            />
          </>
        ) : (
          <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-16 text-center">
            <span
              className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
              aria-hidden="true"
            >
              <Award className="size-7" />
            </span>
            <p className="mt-3 text-base font-medium text-foreground">
              Este módulo se evalúa por actividades
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Revisa la pestaña «Notas» para ver tus calificaciones.
            </p>
          </div>
        )}
      </div>

      {/* Columna lateral */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
          {/* Pestañas */}
          <div
            role="tablist"
            aria-label="Panel del módulo"
            className="grid grid-cols-3 border-b"
          >
            <PanelTabButton
              active={tab === "temario"}
              onClick={() => setTab("temario")}
              icon={<ListVideo className="size-4" />}
            >
              Temario
            </PanelTabButton>
            <PanelTabButton
              active={tab === "calificaciones"}
              onClick={() => setTab("calificaciones")}
              icon={<Award className="size-4" />}
            >
              Notas
            </PanelTabButton>
            <PanelTabButton
              active={tab === "chat"}
              onClick={() => setTab("chat")}
              icon={<MessageSquare className="size-4" />}
            >
              Chat
              <ChatTabBadge count={chatState.unreadCount} />
            </PanelTabButton>
          </div>

          {tab === "temario" ? (
            <div>
              {/* Progreso */}
              <div className="border-b p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-heading text-sm font-semibold">
                    {learn.name}
                  </p>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-primary">
                    {progress}%
                  </span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Avance del módulo"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {completedCount} de {temarioContents.length}{" "}
                  {temarioContents.length === 1
                    ? "contenido completado"
                    : "contenidos completados"}
                </p>
              </div>

              {/* Lista de contenidos */}
              <ol className="max-h-[28rem] overflow-y-auto p-2">
                {temarioContents.map((c, i) => {
                  const active = c.id === selected?.id;
                  const Icon = KIND_ICON[c.kind];
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                          active
                            ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                            : "hover:bg-muted/60",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full",
                            c.completed
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : active
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                          )}
                          aria-hidden="true"
                        >
                          {c.completed ? (
                            <Check className="size-3.5" />
                          ) : (
                            <Icon className="size-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                              {i + 1}.
                            </span>
                            <span
                              className={cn(
                                "truncate text-sm",
                                active
                                  ? "font-semibold text-primary"
                                  : "font-medium",
                              )}
                            >
                              {c.title}
                            </span>
                          </span>
                          <span className="ml-5 mt-0.5 block text-[0.7rem] text-muted-foreground">
                            {KIND_LABEL[c.kind]}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : tab === "calificaciones" ? (
            <GradesPanel module={learn} />
          ) : (
            <ModuleChat
              chat={chatState}
              contactNoun="docente"
              emptyText="Este módulo aún no tiene docentes asignados para chatear."
              compact
            />
          )}
        </div>
      </aside>
    </div>
  );
}

/** Panel "Notas": calificaciones de las actividades + nota final del módulo. */
function GradesPanel({ module: learn }: { module: LearnModule }) {
  const activities = learn.contents.filter((c) => c.kind === "ACTIVITY");
  const grade = learn.grade;
  // Aprobado/reprobado solo cuando el módulo está concluido; si está activo se
  // muestra "En curso" aunque ya tenga nota calculada.
  const isFinished = learn.status === "FINISHED";
  const badgeStatus: ModuleGradeStatus | null = grade
    ? isFinished
      ? grade.status
      : "IN_PROGRESS"
    : null;

  return (
    <div className="space-y-4 p-4">
      {/* Nota del módulo */}
      <div className="rounded-xl border bg-muted/20 p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Nota del módulo
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="font-heading text-2xl font-bold tabular-nums">
            {grade?.finalScore ?? "—"}
          </span>
          <ModuleGradeBadge status={badgeStatus} />
        </div>
        {grade?.observations && (
          <div className="mt-3 rounded-lg border bg-card p-3">
            <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              Observación del docente
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">
              {grade.observations}
            </p>
          </div>
        )}
      </div>

      {/* Calificaciones por actividad */}
      <div>
        <p className="px-1 text-xs font-medium text-muted-foreground">
          Actividades
        </p>
        {activities.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
            Este módulo no tiene actividades.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {activities.map((a) => {
              const sub = a.submission;
              const graded = sub?.status === "GRADED" && sub.score !== null;
              return (
                <li key={a.id} className="rounded-xl border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {a.title}
                    </p>
                    <span className="shrink-0 font-heading text-sm font-bold tabular-nums">
                      {graded ? (
                        <>
                          {sub!.score}
                          <span className="text-xs font-normal text-muted-foreground">
                            /{a.maxScore ?? 100}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          Sin calificar
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {a.weight ? <span>Peso {a.weight}%</span> : null}
                    {sub?.status && <SubmissionStatusText status={sub.status} />}
                  </div>
                  {graded && sub!.feedback && (
                    <p className="mt-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs text-foreground/90">
                      {sub!.feedback}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ModuleGradeBadge({ status }: { status: ModuleGradeStatus | null }) {
  const meta: Record<ModuleGradeStatus, { label: string; cls: string }> = {
    IN_PROGRESS: {
      label: "En curso",
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    },
    PASSED: {
      label: "Aprobado",
      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    FAILED: {
      label: "Reprobado",
      cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    },
  };
  const m = status ? meta[status] : null;
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        m?.cls ?? "bg-muted text-muted-foreground",
      )}
    >
      {m?.label ?? "Sin nota"}
    </span>
  );
}

function SubmissionStatusText({ status }: { status: SubmissionStatus }) {
  const label: Record<SubmissionStatus, string> = {
    PENDING: "Sin entregar",
    SUBMITTED: "Entregada",
    LATE: "Entregada tarde",
    GRADED: "Calificada",
  };
  return <span>{label[status]}</span>;
}

/** Panel principal: renderiza el contenido seleccionado según su tipo. */
function ContentMain({
  content,
  courseName,
  courseId,
  readOnly,
}: {
  content: LearnContent;
  courseName: string;
  courseId: string;
  readOnly: boolean;
}) {
  const header = (
    <div className={content.kind === "VIDEO" ? "mt-5" : ""}>
      <p className="flex items-center gap-2 text-sm font-medium text-primary">
        {courseName}
        <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
          {KIND_LABEL[content.kind]}
        </span>
      </p>
      <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight">
        {content.title}
      </h1>
    </div>
  );

  switch (content.kind) {
    case "VIDEO":
      return (
        <>
          <LessonVideo videoUrl={content.videoUrl} title={content.title} />
          {header}
        </>
      );
    case "TEXT":
      return (
        <>
          {header}
          <div className="mt-5 rounded-2xl border bg-card p-5 shadow-sm shadow-blue-950/[0.04] sm:p-6 dark:shadow-none">
            {content.body ? (
              <RichTextContent html={content.body} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Este tema aún no tiene contenido.
              </p>
            )}
          </div>
        </>
      );
    case "MATERIAL":
      return (
        <>
          {header}
          <div className="mt-5">
            <MaterialViewer content={content} />
          </div>
        </>
      );
    case "ACTIVITY":
      return (
        <>
          {header}
          <div className="mt-5">
            <StudentActivity
              courseId={courseId}
              activity={toActivity(content)}
              readOnly={readOnly}
            />
          </div>
        </>
      );
  }
}

/** Visor de un material: previsualiza imágenes y PDFs; si no, tarjeta de descarga. */
function MaterialViewer({ content }: { content: LearnContent }) {
  const url = content.url ?? "";
  const isInternal = url.startsWith("/files");
  const lower = url.split("?")[0].toLowerCase();
  const isImage = /\.(png|jpe?g|gif|webp|avif|svg)$/.test(lower);
  const isPdf = lower.endsWith(".pdf");

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={content.title}
          className="max-h-[34rem] w-full bg-muted/30 object-contain"
        />
      ) : isPdf ? (
        <iframe
          src={url}
          title={content.title}
          className="h-[36rem] w-full bg-muted/30"
        />
      ) : null}
      <div className="flex items-center justify-between gap-3 p-4">
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
            aria-hidden="true"
          >
            <Paperclip className="size-4.5" />
          </span>
          <span className="truncate text-sm font-medium">{content.title}</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          render={
            <a
              href={url}
              target={isInternal ? undefined : "_blank"}
              rel={isInternal ? undefined : "noopener noreferrer"}
              download={isInternal ? "" : undefined}
            />
          }
        >
          {isInternal ? (
            <Download className="size-4" />
          ) : (
            <ExternalLink className="size-4" />
          )}
          {isInternal ? "Descargar" : "Abrir enlace"}
        </Button>
      </div>
    </div>
  );
}

function PanelTabButton({
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
        "flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
        active
          ? "border-b-2 border-primary text-foreground"
          : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </button>
  );
}

function ProgressButton({
  moduleId,
  content,
  readOnly,
}: {
  moduleId: string;
  content: LearnContent;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Módulo concluido: el progreso ya no se puede cambiar.
  if (readOnly) return null;

  function toggle() {
    const next = !content.completed;
    startTransition(async () => {
      const result = await setProgressAction(moduleId, content.id, next);
      if (result.ok) {
        toast.success(next ? "Marcado como completado" : "Marcado como pendiente");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="mt-6">
      <Button
        type="button"
        variant={content.completed ? "outline" : "default"}
        onClick={toggle}
        disabled={pending}
        aria-pressed={content.completed}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : content.completed ? (
          <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
        ) : null}
        {content.completed ? "Completado" : "Marcar como completado"}
      </Button>
    </div>
  );
}
