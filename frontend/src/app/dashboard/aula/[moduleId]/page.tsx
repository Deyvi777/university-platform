import { Layers, Lock } from "lucide-react";
import { BackLink } from "@/components/dashboard/back-link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getLearnModule } from "@/lib/api/me";
import { ClassroomView } from "./classroom-view";

export const metadata = {
  title: "Aula",
};

export default async function ClassroomPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  await requireUser();
  const { moduleId } = await params;
  const mod = await getLearnModule(moduleId);
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
      </header>

      {mod.status === "FINISHED" && (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          Este módulo está concluido. Puedes revisar todo el contenido y tus
          notas, pero no enviar actividades ni hacer cambios.
        </p>
      )}

      <div className="mt-6">
        <ClassroomView module={mod} />
      </div>
    </div>
  );
}
