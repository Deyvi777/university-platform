import { BackLink } from "@/components/dashboard/back-link";
import { requireAdmin } from "@/lib/auth-guard";
import { PartnerForm } from "@/app/dashboard/partners/partner-form";

export default async function NuevaInstitucionPage() {
  await requireAdmin();

  return (
    <div className="w-full">
      <BackLink href="/dashboard/partners">Volver a instituciones</BackLink>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Nueva institución
      </h1>
      <div className="mt-6">
        <PartnerForm />
      </div>
    </div>
  );
}
