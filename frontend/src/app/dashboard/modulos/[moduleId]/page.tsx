import { ArrowLeft, Layers } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getModuleGradebook, getTeacherModule } from "@/lib/api/teacher";
import { ModuleWorkspace } from "./module-workspace";

export const metadata = {
  title: "Gestionar módulo",
};

export default async function ModuleManagePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  await requireUser();
  const { moduleId } = await params;
  const [mod, gradebook] = await Promise.all([
    getTeacherModule(moduleId),
    getModuleGradebook(moduleId),
  ]);
  if (!mod) {
    notFound();
  }

  return (
    <div className="w-full">
      <Link
        href={`/dashboard/mis-cursos/${mod.course.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al curso
      </Link>

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

      <div className="mt-8">
        <ModuleWorkspace
          moduleId={mod.id}
          contents={mod.contents}
          gradebook={gradebook}
        />
      </div>
    </div>
  );
}
