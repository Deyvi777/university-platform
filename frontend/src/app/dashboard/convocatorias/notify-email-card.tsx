import { NotifyEmailCard as AdminNotifyEmailCard } from "@/components/admin/notify-email-card";
import { updateCallNotifyEmailAction } from "./actions";

/** Buzón que recibe el aviso por correo de cada nueva postulación. */
export function CallNotifyEmailCard({ email }: { email: string }) {
  return (
    <AdminNotifyEmailCard
      email={email}
      description="Cada postulación nueva se envía a"
      successMessage="Correo de postulaciones actualizado"
      updateEmailAction={updateCallNotifyEmailAction}
    />
  );
}
