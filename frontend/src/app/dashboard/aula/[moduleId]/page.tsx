import { Layers, Lock, UsersRound } from "lucide-react";
import { BackLink } from "@/components/dashboard/back-link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getLearnModule } from "@/lib/api/me";
import { getModuleSchedule } from "@/lib/api/teacher";
import { getChatContacts } from "@/lib/api/chat";
import { ClassroomView } from "./classroom-view";

export const metadata = {
  title: "Aula",
};

export default async function ClassroomPage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ chat?: string | string[]; content?: string | string[] }>;
}) {
  const session = await requireUser();
  const { moduleId } = await params;
  const { chat, content } = await searchParams;
  const chatParam = Array.isArray(chat) ? chat[0] : chat;
  // `?chat=1` solo abre la pestaña; `?chat=<id>` además preselecciona el contacto.
  const initialChatContactId =
    chatParam && chatParam !== "1" ? chatParam : undefined;
  const openChat = Boolean(chatParam);
  // `?content=<id>` (desde una notificación de actividad) abre ese contenido.
  const initialContentId = Array.isArray(content) ? content[0] : content;
  const [mod, schedule, chatContacts] = await Promise.all([
    getLearnModule(moduleId),
    getModuleSchedule(moduleId),
    getChatContacts(moduleId),
  ]);
  if (!mod) {
    notFound();
  }

  return (
    <div className="w-full">
      <BackLink href="/dashboard/mis-programas">Volver a mis programas</BackLink>

      <header className="mt-3">
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Layers className="size-4" aria-hidden="true" />
          {mod.course.name} · Módulo {mod.order}
        </p>
        <h2 className="mt-0.5 font-heading text-xl font-bold tracking-tight">
          {mod.name}
        </h2>
        {mod.description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {mod.description}
          </p>
        )}
        {mod.teachers.length > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <UsersRound className="size-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-medium text-foreground">
                {mod.teachers.length === 1 ? "Docente" : "Docentes"}:
              </span>{" "}
              {mod.teachers
                .map((t) => `${t.lastName} ${t.firstName}`)
                .join(", ")}
            </span>
          </p>
        )}
      </header>

      {mod.status === "FINISHED" && (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          Este módulo está concluido. Puedes revisar todo el contenido y tus
          notas, pero no enviar actividades ni hacer cambios.
        </p>
      )}

      <div className="mt-6">
        <ClassroomView
          module={mod}
          schedule={schedule}
          chat={{
            contacts: chatContacts,
            currentUserId: session.user.id,
            token: session.accessToken ?? "",
          }}
          initialChatContactId={initialChatContactId}
          openChat={openChat}
          initialContentId={initialContentId}
        />
      </div>
    </div>
  );
}
