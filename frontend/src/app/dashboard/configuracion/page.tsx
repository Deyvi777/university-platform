import { requireAdmin } from "@/lib/auth-guard";
import { getAdminSettings } from "@/lib/api/admin";
import { SettingsForm } from "@/app/dashboard/configuracion/settings-form";

export default async function ConfiguracionPage() {
  await requireAdmin();
  const settings = await getAdminSettings();

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Redes sociales</h1>
        <p className="mt-1 text-muted-foreground">
          Enlaces que se muestran en el footer de la landing. Solo aparecen las
          redes que tengan un enlace.
        </p>
      </div>

      <div className="mt-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
