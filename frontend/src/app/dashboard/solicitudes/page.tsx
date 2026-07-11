import { requireAdmin } from "@/lib/auth-guard";
import {
  getAdminSettings,
  listAdminEnrollmentRequests,
} from "@/lib/api/admin";
import { NotifyEmailCard } from "@/app/dashboard/solicitudes/notify-email-card";
import { RequestsTable } from "@/app/dashboard/solicitudes/requests-table";

export default async function SolicitudesPage() {
  await requireAdmin();
  const [requests, settings] = await Promise.all([
    listAdminEnrollmentRequests(),
    getAdminSettings(),
  ]);
  const pending = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold tracking-tight">
        Solicitudes de inscripción
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Solicitudes enviadas desde el formulario de la landing.
        {pending > 0
          ? ` ${pending} pendiente${pending === 1 ? "" : "s"} de inscribir.`
          : " No hay solicitudes pendientes."}
      </p>
      <div className="mt-6">
        <NotifyEmailCard email={settings.enrollmentNotifyEmail} />
      </div>
      <div className="mt-4">
        <RequestsTable requests={requests} />
      </div>
    </div>
  );
}
