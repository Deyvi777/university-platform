import { CalendarDays } from "lucide-react";
import { redirect } from "next/navigation";
import { ProfileCalendar } from "@/components/dashboard/profile-calendar";
import { requireUser } from "@/lib/auth-guard";

export const metadata = {
  title: "Calendario",
};

export default async function CalendarPage() {
  const session = await requireUser();
  const role = session.user.role;

  if (role !== "PROFESSOR" && role !== "STUDENT") {
    redirect("/dashboard");
  }

  return (
    <div>
      <header className="flex items-start gap-4">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-950 text-amber-300 shadow-lg shadow-blue-950/15 dark:bg-sky-300 dark:text-slate-950"
          aria-hidden="true"
        >
          <CalendarDays className="size-6" />
        </span>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Calendario
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Organiza tus clases, entregas y recordatorios en un solo lugar.
          </p>
        </div>
      </header>

      <div className="mt-7">
        <ProfileCalendar role={role} variant="expanded" />
      </div>
    </div>
  );
}
