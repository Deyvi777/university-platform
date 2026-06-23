import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { PartnerForm } from "@/app/dashboard/partners/partner-form";

export default async function NuevaInstitucionPage() {
  await requireAdmin();

  return (
    <div className="w-full">
      <Link
        href="/dashboard/partners"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a instituciones
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Nueva institución
      </h1>
      <div className="mt-6">
        <PartnerForm />
      </div>
    </div>
  );
}
