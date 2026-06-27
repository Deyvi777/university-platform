import { BackLink } from "@/components/dashboard/back-link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { AdminApiError, getAdminTeamMember } from "@/lib/api/admin";
import { TeamMemberForm } from "@/app/dashboard/equipo/team-form";

export default async function EditarIntegrantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  let member;
  try {
    member = await getAdminTeamMember(id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="w-full">
      <BackLink href="/dashboard/equipo">Volver al equipo</BackLink>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Editar integrante
      </h1>
      <div className="mt-6">
        <TeamMemberForm member={member} />
      </div>
    </div>
  );
}
