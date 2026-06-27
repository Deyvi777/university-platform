import { requireAdmin } from "@/lib/auth-guard";
import {
  listAdminAnnouncements,
  listAdminUsers,
  type AnnouncementAudience,
} from "@/lib/api/admin";
import { AnnouncementHistory } from "./announcement-history";
import { NewAnnouncementDialog } from "./new-announcement-dialog";

export const metadata = {
  title: "Avisos",
};

const AUDIENCE_VALUES: AnnouncementAudience[] = [
  "ALL",
  "PROFESSORS",
  "STUDENTS",
  "SELECTED",
];

export default async function SendNotificationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  // Filtros del historial vía URL (server-side).
  const sp = await searchParams;
  const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const rawAud = Array.isArray(sp.aud) ? sp.aud[0] : sp.aud;
  const rawQ = Array.isArray(sp.q) ? sp.q[0] : sp.q;

  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const audience = AUDIENCE_VALUES.includes(rawAud as AnnouncementAudience)
    ? (rawAud as AnnouncementAudience)
    : undefined;
  const q = rawQ?.trim() || undefined;

  const [professors, students, announcements] = await Promise.all([
    listAdminUsers("PROFESSOR"),
    listAdminUsers("STUDENT"),
    listAdminAnnouncements({ page, audience, q }),
  ]);

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Avisos
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Envía notificaciones a docentes y estudiantes, a todos o a usuarios
            específicos. Aquí también ves el historial de avisos enviados.
          </p>
        </div>
        <NewAnnouncementDialog professors={professors} students={students} />
      </header>

      <div className="mt-10">
        <AnnouncementHistory
          page={announcements}
          audience={audience}
          q={q ?? ""}
        />
      </div>
    </div>
  );
}
