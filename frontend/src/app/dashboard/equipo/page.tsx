import { requireAdmin } from "@/lib/auth-guard";
import { listAdminTeam } from "@/lib/api/admin";
import { TeamList } from "@/app/dashboard/equipo/team-list";
import { CreateTeamMemberButton } from "@/app/dashboard/equipo/team-dialogs";

export default async function TeamAdminPage() {
  await requireAdmin();
  const team = await listAdminTeam();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="mt-1 text-muted-foreground">
            {team.length} {team.length === 1 ? "integrante" : "integrantes"}.
            Arrastra para reordenar; ese orden es el que se muestra en la
            landing.
          </p>
        </div>
        <CreateTeamMemberButton />
      </div>

      <TeamList team={team} />
    </div>
  );
}
