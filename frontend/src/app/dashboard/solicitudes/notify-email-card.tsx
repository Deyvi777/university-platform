import { NotifyEmailCard as AdminNotifyEmailCard } from "@/components/admin/notify-email-card";
import { updateNotifyEmailAction } from "@/app/dashboard/solicitudes/actions";

/**
 * Buzón que recibe el aviso por correo de cada solicitud (edición inline).
 * El valor vive en la fila única de configuración del sitio (`SiteSettings`).
 */
export function NotifyEmailCard({ email }: { email: string }) {
  return (
    <AdminNotifyEmailCard
      email={email}
      description="Cada solicitud nueva se envía a"
      successMessage="Correo de avisos actualizado"
      updateEmailAction={updateNotifyEmailAction}
    />
  );
}
