import { requireUser } from "@/lib/auth-guard";
import { listNotifications } from "@/lib/api/notifications";
import { NotificationsInbox } from "./notifications-inbox";

export const metadata = {
  title: "Notificaciones",
};

export default async function NotificationsInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string | string[] }>;
}) {
  const session = await requireUser();
  const notifications = await listNotifications();
  const { open } = await searchParams;
  const initialOpenId = Array.isArray(open) ? open[0] : open;

  return (
    <NotificationsInbox
      initialNotifications={notifications}
      initialOpenId={initialOpenId}
      role={session.user.role}
    />
  );
}
