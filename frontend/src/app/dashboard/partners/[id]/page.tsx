import { BackLink } from "@/components/dashboard/back-link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { AdminApiError, getAdminPartner } from "@/lib/api/admin";
import { PartnerForm } from "@/app/dashboard/partners/partner-form";

export default async function EditarInstitucionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  let partner;
  try {
    partner = await getAdminPartner(id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="w-full">
      <BackLink href="/dashboard/partners">Volver a instituciones</BackLink>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Editar institución
      </h1>
      <div className="mt-6">
        <PartnerForm partner={partner} />
      </div>
    </div>
  );
}
