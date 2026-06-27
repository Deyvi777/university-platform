import { BackLink } from "@/components/dashboard/back-link";
import { requireAdmin } from "@/lib/auth-guard";
import { TeamMemberForm } from "@/app/dashboard/equipo/team-form";

export default async function NuevoIntegrantePage() {
  await requireAdmin();

  return (
    <div className="w-full">
      <BackLink href="/dashboard/equipo">Volver al equipo</BackLink>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Nuevo integrante
      </h1>
      <div className="mt-6">
        <TeamMemberForm />
      </div>
    </div>
  );
}
