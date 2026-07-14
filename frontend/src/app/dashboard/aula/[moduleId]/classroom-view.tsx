"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  ExternalLink,
  FileArchive,
  FileText,
  Folder,
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
import {
  ClassScheduleList,
  localDateKey,
} from "@/components/dashboard/class-schedule";
import type { ClassSession } from "@/lib/api/teacher";
import type { ChatContact } from "@/lib/api/chat";
import type {
  ContentKind,
  CourseActivity,
  FolderFile,
  LearnContent,
  LearnModule,
  ModuleGradeStatus,
  SubmissionStatus,
} from "@/lib/api/me";
import { ACTIVITY_TYPES } from "@/lib/activity-types";
import { cn } from "@/lib/utils";
import { ForumThread } from "@/components/dashboard/forum-thread";
import { QuizRunner } from "@/components/dashboard/quiz-runner";
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
  FOLDER: Folder,
};

// Color del badge del icono por tipo de contenido (fondo + texto, claro+oscuro).
// Coincide con `KIND_META` del gestor del docente (`content-manager.tsx`); para
// una ACTIVITY el color sale del `activityType` (registro `ACTIVITY_TYPES`).
const KIND_TINT: Record<ContentKind, string> = {
  TEXT: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  VIDEO: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  MATERIAL: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  ACTIVITY:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  FOLDER: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
};

const KIND_LABEL: Record<ContentKind, string> = {
  TEXT: "Tema",
  VIDEO: "Video",
  MATERIAL: "Material",
  ACTIVITY: "Actividad",
  FOLDER: "Carpeta",
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
    activityFileUrl: c.activityFileUrl,
    activityFileName: c.activityFileName,
    dueDate: c.dueDate,
    maxScore: c.maxScore ?? 100,
    weight: c.weight ?? 0,
    submission: c.submission,
  };
}

export function ClassroomView({
  module: learn,
  schedule = [],
  chat,
  initialChatContactId,
  openChat = false,
  initialContentId,
}: {
  module: LearnModule;
  /** Cronograma de clases del módulo (definido por el docente). */
  schedule?: ClassSession[];
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
  // Carpetas contraídas en el temario (por defecto expandidas) + cuál se está
  // comprimiendo en ZIP.
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(
    () => new Set(),
  );
  const [zippingId, setZippingId] = useState<string | null>(null);
  // Archivo de carpeta abierto en el panel central (se previsualiza como un
  // material). `null` = se muestra el contenido seleccionado normal.
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  // "Hoy" fijado una vez por montaje (regla react-hooks/purity), para marcar
  // las clases pasadas/próximas del cronograma.
  const today = useMemo(() => localDateKey(new Date()), []);

  function toggleFolder(id: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function downloadFolder(content: LearnContent) {
    const files = content.folderFiles ?? [];
    if (!files.length) return;
    setZippingId(content.id);
    try {
      await zipAndDownloadFolder(content.title, files);
    } catch {
      toast.error("No se pudo generar el ZIP");
    } finally {
      setZippingId(null);
    }
  }

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

  // Archivo de carpeta abierto (y su carpeta) para previsualizarlo en el centro.
  const selectedFile = selectedFileId
    ? (contents
        .flatMap((c) => c.folderFiles ?? [])
        .find((f) => f.id === selectedFileId) ?? null)
    : null;
  const selectedFileFolder = selectedFileId
    ? (contents.find((c) =>
        (c.folderFiles ?? []).some((f) => f.id === selectedFileId),
      ) ?? null)
    : null;

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
        {selectedFile ? (
          <FolderFilePanel
            file={selectedFile}
            folderTitle={selectedFileFolder?.title ?? "Carpeta"}
            courseName={learn.course.name}
            onBack={() => setSelectedFileId(null)}
          />
        ) : selected ? (
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

      {/* Columna lateral. El borde teñido de primario + la franja de pestañas
          diferencian este panel del resto de tarjetas: aquí viven el temario,
          las actividades y las notas del estudiante. */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="overflow-hidden rounded-2xl border-2 border-primary/25 bg-card shadow-md shadow-blue-950/[0.08] dark:shadow-none">
          {/* Pestañas */}
          <div
            role="tablist"
            aria-label="Panel del módulo"
            className="grid grid-cols-3 border-b bg-muted/50 dark:bg-white/[0.04]"
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

              {/* Cronograma de clases (si el docente lo definió) */}
              {schedule.length > 0 && (
                <details className="group border-b">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    <CalendarDays
                      className="size-4 text-sky-600 dark:text-sky-300"
                      aria-hidden="true"
                    />
                    Cronograma de clases
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                      {schedule.length}
                    </span>
                    <ChevronDown
                      className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="px-3 pb-3">
                    <ClassScheduleList sessions={schedule} today={today} />
                  </div>
                </details>
              )}

              {/* Lista de contenidos */}
              <ol className="max-h-[28rem] overflow-y-auto p-2">
                {temarioContents.map((c, i) => {
                  const active = c.id === selected?.id;
                  // Una ACTIVITY muestra el icono de su `activityType` (el mismo
                  // del selector de creación), no el genérico de "Actividad".
                  const activityMeta =
                    c.kind === "ACTIVITY"
                      ? ACTIVITY_TYPES[c.activityType ?? "ASSIGNMENT"]
                      : null;
                  const Icon = activityMeta?.Icon ?? KIND_ICON[c.kind];
                  const iconTint = activityMeta?.tint ?? KIND_TINT[c.kind];
                  const isFolder = c.kind === "FOLDER";
                  const folderFiles = c.folderFiles ?? [];
                  const expanded = isFolder && !collapsedFolders.has(c.id);
                  return (
                    <li key={c.id}>
                      <div className="flex items-stretch gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(c.id);
                            setSelectedFileId(null);
                          }}
                          aria-current={
                            active && !selectedFileId ? "true" : undefined
                          }
                          className={cn(
                            "flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                            active
                              ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                              : "hover:bg-muted/60",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-full",
                              // Completado = check verde; si no, el color del
                              // tipo de contenido/actividad (como en el gestor
                              // del docente y el selector de creación).
                              c.completed
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : iconTint,
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
                            <span className="ml-5 mt-0.5 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
                              {isFolder
                                ? `${folderFiles.length} ${
                                    folderFiles.length === 1
                                      ? "archivo"
                                      : "archivos"
                                  }`
                                : (activityMeta?.label ?? KIND_LABEL[c.kind])}
                              {/* Examen de recuperación: se toma la nota mayor. */}
                              {c.recoveryStage && (
                                <span
                                  className={cn(
                                    "inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[0.6rem] font-semibold",
                                    c.recoveryStage === "SEGUNDA_INSTANCIA"
                                      ? "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
                                      : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
                                  )}
                                >
                                  {c.recoveryStage === "SEGUNDA_INSTANCIA"
                                    ? "2.ª instancia"
                                    : "Recuperatorio"}
                                </span>
                              )}
                            </span>
                          </span>
                        </button>
                        {isFolder && folderFiles.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleFolder(c.id)}
                            aria-expanded={expanded}
                            aria-label={
                              expanded ? "Contraer carpeta" : "Expandir carpeta"
                            }
                            className="flex w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                          >
                            <ChevronDown
                              className={cn(
                                "size-4 transition-transform",
                                expanded ? "" : "-rotate-90",
                              )}
                            />
                          </button>
                        )}
                      </div>

                      {/* Archivos de la carpeta, indentados a la derecha. */}
                      {isFolder && expanded && folderFiles.length > 0 && (
                        <div className="ml-7 mt-1 space-y-0.5 border-l border-border pl-3">
                          {folderFiles.map((f) => {
                            const fileActive = f.id === selectedFileId;
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => {
                                  setSelectedId(c.id);
                                  setSelectedFileId(f.id);
                                }}
                                aria-current={fileActive ? "true" : undefined}
                                title="Ver en el panel central"
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
                                  fileActive
                                    ? "bg-primary/10 font-medium text-primary ring-1 ring-primary/20"
                                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                                )}
                              >
                                <FileText className="size-3.5 shrink-0" />
                                <span className="min-w-0 flex-1 truncate">
                                  {f.name}
                                </span>
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => downloadFolder(c)}
                            disabled={zippingId === c.id}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
                          >
                            {zippingId === c.id ? (
                              <Loader2 className="size-3.5 shrink-0 animate-spin" />
                            ) : (
                              <FileArchive className="size-3.5 shrink-0" />
                            )}
                            Descargar carpeta (ZIP)
                          </button>
                        </div>
                      )}
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
                    {/* Recuperación: no pondera — la nota final es la mayor
                        entre la del módulo y la del examen, con tope en la
                        nota de aprobación. */}
                    {a.recoveryStage ? (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-1.5 py-px text-[0.65rem] font-semibold",
                          a.recoveryStage === "SEGUNDA_INSTANCIA"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
                        )}
                      >
                        {a.recoveryStage === "SEGUNDA_INSTANCIA"
                          ? "Segunda instancia — se toma la nota mayor"
                          : "Recuperatorio — se toma la nota mayor"}
                      </span>
                    ) : null}
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
            <MaterialViewer url={content.url ?? ""} title={content.title} />
          </div>
        </>
      );
    case "ACTIVITY":
      return (
        <>
          {header}
          <div className="mt-5">
            {content.activityType === "FORUM" ? (
              <ForumThread activityId={content.id} />
            ) : content.activityType === "QUIZ" ||
              content.activityType === "EXAM" ? (
              <QuizRunner activityId={content.id} />
            ) : (
              <StudentActivity
                courseId={courseId}
                activity={toActivity(content)}
                readOnly={readOnly}
              />
            )}
          </div>
        </>
      );
    case "FOLDER":
      return (
        <>
          {header}
          <div className="mt-5">
            <FolderViewer content={content} />
          </div>
        </>
      );
  }
}

/** Descarga todos los archivos de una carpeta como un único ZIP (en el cliente). */
async function zipAndDownloadFolder(title: string, files: FolderFile[]) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  await Promise.all(
    files.map(async (f) => {
      const res = await fetch(f.url);
      if (!res.ok) throw new Error(`No se pudo descargar ${f.name}`);
      zip.file(f.name, await res.blob());
    }),
  );
  const blob = await zip.generateAsync({ type: "blob" });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `${title.trim() || "carpeta"}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Panel principal de una carpeta: lista de archivos + descargar todo en ZIP. */
function FolderViewer({ content }: { content: LearnContent }) {
  const files = content.folderFiles ?? [];
  const [zipping, setZipping] = useState(false);

  async function downloadZip() {
    if (!files.length) return;
    setZipping(true);
    try {
      await zipAndDownloadFolder(content.title, files);
    } catch {
      toast.error("No se pudo generar el ZIP");
    } finally {
      setZipping(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <span className="flex items-center gap-2.5 text-sm font-medium">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
            aria-hidden="true"
          >
            <Folder className="size-4.5" />
          </span>
          {files.length} {files.length === 1 ? "archivo" : "archivos"}
        </span>
        {files.length > 0 && (
          <Button type="button" size="sm" disabled={zipping} onClick={downloadZip}>
            {zipping ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileArchive className="size-4" />
            )}
            Descargar carpeta (ZIP)
          </Button>
        )}
      </div>
      {files.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Esta carpeta aún no tiene archivos.
        </p>
      ) : (
        <ul className="divide-y">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <FileText
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
              <a
                href={f.url}
                target={f.url.startsWith("/files") ? undefined : "_blank"}
                rel="noopener noreferrer"
                download={f.url.startsWith("/files") ? "" : undefined}
                className="inline-flex shrink-0 items-center gap-1.5 text-xs text-sky-600 hover:underline dark:text-sky-400"
              >
                <Download className="size-3.5" />
                Descargar
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Panel central de un archivo dentro de una carpeta: cabecera con contexto +
 * botón para volver a la carpeta, y el mismo visor que un material (PDF/Word/
 * Excel/imagen inline).
 */
function FolderFilePanel({
  file,
  folderTitle,
  courseName,
  onBack,
}: {
  file: FolderFile;
  folderTitle: string;
  courseName: string;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Volver a la carpeta
      </button>
      <div className="mt-3">
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          {courseName}
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            <Folder className="size-3" aria-hidden="true" />
            {folderTitle}
          </span>
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight">
          {file.name}
        </h1>
      </div>
      <div className="mt-5">
        <MaterialViewer url={file.url} title={file.name} />
      </div>
    </div>
  );
}

/**
 * Visor de un archivo: previsualiza imágenes, PDFs, Word, Excel y PowerPoint en
 * el panel central; si no, tarjeta de descarga. Reutilizado por los materiales
 * (kind MATERIAL) y por los archivos dentro de una carpeta.
 */
function MaterialViewer({ url, title }: { url: string; title: string }) {
  const isInternal = url.startsWith("/files");
  const lower = url.split("?")[0].toLowerCase();
  const isImage = /\.(png|jpe?g|gif|webp|avif|svg)$/.test(lower);
  const isPdf = lower.endsWith(".pdf");
  // Word moderno (.docx): se renderiza en el navegador con docx-preview.
  const isDocx = lower.endsWith(".docx");
  // Excel (.xlsx/.xls): se renderiza en el navegador con SheetJS.
  const isExcel = /\.(xlsx|xls)$/.test(lower);
  // Word legacy (.doc) y PowerPoint (.pptx/.ppt): visor online de Office
  // (requiere URL pública; en localhost se ofrece descargar).
  const isOffice = /\.(doc|pptx|ppt)$/.test(lower);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={title}
          className="max-h-[34rem] w-full bg-muted/30 object-contain"
        />
      ) : isPdf ? (
        <iframe
          src={url}
          title={title}
          className="h-[36rem] w-full bg-muted/30"
        />
      ) : isDocx ? (
        <DocxViewer url={url} title={title} />
      ) : isExcel ? (
        <ExcelViewer url={url} title={title} />
      ) : isOffice ? (
        <OfficeViewer url={url} title={title} />
      ) : null}
      <div className="flex items-center justify-between gap-3 p-4">
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
            aria-hidden="true"
          >
            <Paperclip className="size-4.5" />
          </span>
          <span className="truncate text-sm font-medium">{title}</span>
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

/**
 * Visor de documentos Word (.docx) en el navegador. Descarga el archivo del
 * mismo origen (proxy `/files/*`) y lo renderiza con `docx-preview` (importado
 * dinámicamente, solo cliente). A diferencia de los visores online de Office /
 * Google, funciona en localhost y no envía el archivo a terceros.
 */
function DocxViewer({ url, title }: { url: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState("loading");
      try {
        const [{ renderAsync }, res] = await Promise.all([
          import("docx-preview"),
          fetch(url),
        ]);
        if (!res.ok) throw new Error("No se pudo cargar el documento");
        const blob = await res.blob();
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = "";
        await renderAsync(blob, containerRef.current, undefined, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
        });
        if (!cancelled) setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="relative h-[36rem] w-full overflow-auto bg-muted/30">
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Cargando documento…
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-6 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            No se pudo previsualizar el documento
          </p>
          <p>Usa el botón “Descargar” para abrirlo en Word.</p>
        </div>
      )}
      {/* docx-preview inyecta el documento renderizado dentro de este contenedor. */}
      <div
        ref={containerRef}
        aria-label={title}
        className={cn(
          "docx-host flex justify-center py-4",
          state !== "ready" && "invisible",
        )}
      />
    </div>
  );
}

/**
 * Visor de hojas de cálculo (.xlsx/.xls) en el navegador con SheetJS. Descarga
 * el archivo del mismo origen y renderiza cada hoja como tabla HTML. Funciona en
 * localhost y no envía el archivo a terceros.
 */
function ExcelViewer({ url, title }: { url: string; title: string }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [sheets, setSheets] = useState<{ name: string; html: string }[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState("loading");
      try {
        const [XLSX, res] = await Promise.all([import("xlsx"), fetch(url)]);
        if (!res.ok) throw new Error("No se pudo cargar la hoja de cálculo");
        const buf = await res.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const out = wb.SheetNames.map((name) => ({
          name,
          html: XLSX.utils.sheet_to_html(wb.Sheets[name]),
        }));
        if (cancelled) return;
        setSheets(out);
        setActive(0);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="relative h-[36rem] w-full overflow-hidden bg-muted/30">
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Cargando hoja de cálculo…
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-6 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            No se pudo previsualizar la hoja de cálculo
          </p>
          <p>Usa el botón “Descargar” para abrirla en Excel.</p>
        </div>
      )}
      {state === "ready" && (
        <div className="flex h-full flex-col">
          {sheets.length > 1 && (
            <div className="flex flex-wrap gap-1 border-b bg-card px-3 py-2">
              {sheets.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    i === active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
          <div
            aria-label={title}
            className="min-w-0 flex-1 overflow-auto bg-white p-3 text-sm text-slate-900 [&_table]:border-collapse [&_td]:whitespace-nowrap [&_td]:border [&_td]:border-slate-300 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:px-2 [&_th]:py-1"
            // SheetJS produce HTML estático de solo lectura.
            dangerouslySetInnerHTML={{ __html: sheets[active]?.html ?? "" }}
          />
        </div>
      )}
    </div>
  );
}

const subscribeNoop = () => () => {};
/** `true` solo tras montar en cliente (sin `useEffect`, evita la regla
 * `react-hooks/set-state-in-effect`). Igual patrón que el theme-toggle. */
function useMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

/**
 * Visor de Word legacy (.doc) y PowerPoint (.ppt/.pptx) mediante el visor online
 * de Microsoft Office. Requiere que el archivo sea accesible públicamente, así
 * que en `localhost` no funciona: ahí se ofrece descargarlo.
 */
function OfficeViewer({ url, title }: { url: string; title: string }) {
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="flex h-[36rem] w-full items-center justify-center gap-2 bg-muted/30 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Cargando vista previa…
      </div>
    );
  }

  const host = window.location.hostname;
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";

  if (isLocal) {
    return (
      <div className="flex h-[36rem] w-full flex-col items-center justify-center gap-1 bg-muted/30 px-6 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          Vista previa no disponible en entorno local
        </p>
        <p>
          La previsualización de este formato requiere un sitio público. Usa el
          botón “Descargar” para abrirlo.
        </p>
      </div>
    );
  }

  const abs = url.startsWith("http")
    ? url
    : `${window.location.origin}${url}`;
  const src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(abs)}`;

  return (
    <iframe src={src} title={title} className="h-[36rem] w-full bg-muted/30" />
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
        // Activa: "levantada" sobre la franja (fondo de tarjeta + texto primario),
        // para que se lea como la sección abierta del panel.
        active
          ? "border-b-2 border-primary bg-card font-semibold text-primary"
          : "border-b-2 border-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground",
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
