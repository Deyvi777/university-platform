import { FolderOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/back-link";
import { requireUser } from "@/lib/auth-guard";
import { getMyCourse } from "@/lib/api/me";
import { PortfolioViewer } from "./portfolio-viewer";

export const metadata = {
  title: "Portafolio del programa",
};

export default async function CoursePortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const course = await getMyCourse(id);
  if (!course) notFound();

  return (
    <div className="w-full">
      <BackLink href={`/dashboard/mis-cursos/${course.id}`}>
        Volver al programa
      </BackLink>
      <header className="mt-4 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FolderOpen className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-xs text-muted-foreground">
            {course.code}
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Portafolio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{course.name}</p>
        </div>
      </header>

      <div className="mt-6 w-full">
        <PortfolioViewer files={course.files} />
      </div>
    </div>
  );
}
