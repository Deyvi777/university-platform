import { Download, ScrollText } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { getKardex } from "@/lib/api/me";
import { KardexCourseCard } from "./kardex-cards";

export const metadata = {
  title: "Kárdex",
};

export default async function KardexPage() {
  await requireUser();
  const courses = await getKardex();

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Kárdex
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Tu historial académico: las notas de cada módulo en los cursos en
            los que estás inscrito.
          </p>
        </div>
        {courses.length > 0 && (
          <Link
            href="/kardex-pdf"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
          >
            <Download className="size-4" aria-hidden="true" />
            Descargar PDF
          </Link>
        )}
      </header>

      {courses.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-3xl border border-dashed bg-muted/20 px-6 py-16 text-center">
          <span
            className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <ScrollText className="size-7" />
          </span>
          <p className="text-base font-medium text-foreground">
            Tu kárdex está vacío
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Cuando te inscriban en un curso y obtengas notas, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {courses.map((course) => (
            <KardexCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
