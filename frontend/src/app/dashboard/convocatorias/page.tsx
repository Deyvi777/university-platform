import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminSettings, listAdminCalls } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { CallsList } from "./calls-list";
import { CallNotifyEmailCard } from "./notify-email-card";

export default async function CallsAdminPage() {
  await requireAdmin();
  const [calls, settings] = await Promise.all([
    listAdminCalls(),
    getAdminSettings(),
  ]);
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Convocatorias</h1>
          <p className="mt-1 text-muted-foreground">
            Publica oportunidades, diseña formularios y revisa postulaciones.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/convocatorias/nuevo" />}
        >
          <Plus className="size-4" /> Nueva convocatoria
        </Button>
      </div>
      <div className="mt-6">
        <CallNotifyEmailCard email={settings.callApplicationNotifyEmail} />
      </div>
      <CallsList calls={calls} />
    </div>
  );
}
