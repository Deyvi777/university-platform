import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/back-link";
import { requireAdmin } from "@/lib/auth-guard";
import { AdminApiError, getAdminCall } from "@/lib/api/admin";
import { CallForm } from "../call-form";

export default async function EditCallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  let call;
  try {
    call = await getAdminCall(id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }
  return (
    <div className="w-full">
      <BackLink href="/dashboard/convocatorias">
        Volver a convocatorias
      </BackLink>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Editar convocatoria
      </h1>
      <div className="mt-6">
        <CallForm call={call} />
      </div>
    </div>
  );
}
