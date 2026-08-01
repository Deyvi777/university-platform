import { BackLink } from "@/components/dashboard/back-link";
import { requireAdmin } from "@/lib/auth-guard";
import { CallForm } from "../call-form";

export default async function NewCallPage() {
  await requireAdmin();
  return (
    <div className="w-full">
      <BackLink href="/dashboard/convocatorias">
        Volver a convocatorias
      </BackLink>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Nueva convocatoria
      </h1>
      <p className="mt-1 text-muted-foreground">
        Configura la publicación y construye su formulario de postulación.
      </p>
      <div className="mt-6">
        <CallForm />
      </div>
    </div>
  );
}
