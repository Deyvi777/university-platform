import { requireAdmin } from "@/lib/auth-guard";
import { listAdminPartners } from "@/lib/api/admin";
import { PartnersList } from "@/app/dashboard/partners/partners-list";
import { CreatePartnerButton } from "@/app/dashboard/partners/partner-dialogs";

export default async function PartnersAdminPage() {
  await requireAdmin();
  const partners = await listAdminPartners();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Instituciones aliadas
          </h1>
          <p className="mt-1 text-muted-foreground">
            {partners.length}{" "}
            {partners.length === 1 ? "institución" : "instituciones"}{" "}
            registradas. Arrastra para reordenar; ese orden es el que se muestra
            en la landing.
          </p>
        </div>
        <CreatePartnerButton />
      </div>

      <PartnersList partners={partners} />
    </div>
  );
}
