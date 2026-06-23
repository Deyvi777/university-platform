import { ArrowLeft, Layers } from "lucide-react";
import Link from "next/link";
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
      <Link
        href="/dashboard/mis-programas"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a mis programas
      </Link>

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

      <div className="mt-6">
        <ClassroomView module={mod} />
      </div>
    </div>
  );
}
