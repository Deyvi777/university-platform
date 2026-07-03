import { Layers, Lock } from "lucide-react";
import { BackLink } from "@/components/dashboard/back-link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getModuleGradebook, getTeacherModule } from "@/lib/api/teacher";
import { getChatContacts } from "@/lib/api/chat";
import { ModuleWorkspace } from "./module-workspace";

export const metadata = {
  title: "Gestionar módulo",
};

export default async function ModuleManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ chat?: string | string[] }>;
}) {
  const session = await requireUser();
  const { moduleId } = await params;
  const { chat } = await searchParams;
  const chatParam = Array.isArray(chat) ? chat[0] : chat;
  // `?chat=1` solo abre la pestaña; `?chat=<id>` además preselecciona el contacto.
  const initialChatContactId =
    chatParam && chatParam !== "1" ? chatParam : undefined;
  const openChat = Boolean(chatParam);
  // El ADMIN gestiona el módulo sin chat (entra desde el detalle del programa).
  const isAdmin = session.user.role === "ADMIN";
  const showChat = !isAdmin;
  const [mod, gradebook, chatContacts] = await Promise.all([
    getTeacherModule(moduleId),
    getModuleGradebook(moduleId),
    showChat ? getChatContacts(moduleId) : Promise.resolve([]),
  ]);
  if (!mod) {
    notFound();
  }

  const backHref = isAdmin
    ? `/dashboard/cursos/${mod.course.id}`
    : `/dashboard/mis-cursos/${mod.course.id}`;

  return (
    <div className="w-full">
      <BackLink href={backHref}>Volver al {isAdmin ? "programa" : "curso"}</BackLink>

      <header className="mt-4">
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Layers className="size-4" aria-hidden="true" />
          {mod.course.name} · Módulo {mod.order}
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          {mod.name}
        </h1>
        {mod.description && (
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {mod.description}
          </p>
        )}
      </header>

      {mod.status === "FINISHED" && (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          Este módulo está concluido. Puedes consultar el contenido y las notas,
          pero no realizar cambios.
        </p>
      )}

      <div className="mt-8">
        <ModuleWorkspace
          moduleId={mod.id}
          contents={mod.contents}
          gradebook={gradebook}
          readOnly={mod.status === "FINISHED"}
          isAdmin={isAdmin}
          chat={{
            contacts: chatContacts,
            currentUserId: session.user.id,
            token: session.accessToken ?? "",
          }}
          initialChatContactId={initialChatContactId}
          openChat={openChat}
          showChat={showChat}
        />
      </div>
    </div>
  );
}
