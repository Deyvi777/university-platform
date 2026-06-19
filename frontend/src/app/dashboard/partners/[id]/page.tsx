import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/partners"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a instituciones
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Editar institución
      </h1>
      <div className="mt-6">
        <PartnerForm partner={partner} />
      </div>
    </div>
  );
}
