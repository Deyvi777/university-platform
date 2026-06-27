import { Plus } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { listAdminPrograms } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { ProgramsList } from "@/app/dashboard/programas/programs-list";

export default async function ProgramasAdminPage() {
  await requireAdmin();
  const programs = await listAdminPrograms();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programas</h1>
          <p className="mt-1 text-muted-foreground">
            {programs.length}{" "}
            {programs.length === 1 ? "programa" : "programas"} registrados.
            Arrastra para reordenar; ese orden es el que se muestra en la
            landing.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/programas/nuevo" />}
        >
          <Plus className="size-4" /> Nuevo programa
        </Button>
      </div>

      <ProgramsList programs={programs} />
    </div>
  );
}
