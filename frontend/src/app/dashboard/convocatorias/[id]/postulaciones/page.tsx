import { notFound } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { DeleteButton } from "@/components/admin/delete-button";
import { BackLink } from "@/components/dashboard/back-link";
import { requireAdmin } from "@/lib/auth-guard";
import {
  AdminApiError,
  getAdminCall,
  listAdminCallApplications,
} from "@/lib/api/admin";
import { formatCallDate } from "@/lib/api/calls";
import { deleteCallApplicationAction } from "../../actions";

export default async function CallApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  let call;
  let applications;
  try {
    [call, applications] = await Promise.all([
      getAdminCall(id),
      listAdminCallApplications(id),
    ]);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="w-full">
      <BackLink href="/dashboard/convocatorias">
        Volver a convocatorias
      </BackLink>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Postulaciones</h1>
      <p className="mt-1 text-muted-foreground">
        {call.title} · {applications.length}{" "}
        {applications.length === 1 ? "respuesta" : "respuestas"}
      </p>

      {!applications.length ? (
        <div className="mt-6 rounded-2xl border bg-card p-10 text-center text-muted-foreground shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
          <FileText className="mx-auto mb-3 size-8" />
          Aún no se recibieron postulaciones.
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {applications.map((application, index) => (
            <article
              key={application.id}
              className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                <div>
                  <h2 className="font-semibold">
                    Postulación #{applications.length - index}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {application.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <time className="text-sm text-muted-foreground">
                    {formatCallDate(application.submittedAt)}
                  </time>
                  <DeleteButton
                    action={deleteCallApplicationAction.bind(
                      null,
                      id,
                      application.id,
                    )}
                    title={`¿Eliminar la postulación #${applications.length - index}?`}
                    confirmMessage="Se eliminarán permanentemente sus respuestas y archivos adjuntos. Esta acción no se puede deshacer."
                  />
                </div>
              </div>
              <dl className="mt-5 grid gap-5 lg:grid-cols-2">
                {application.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className="rounded-xl border bg-background p-4"
                  >
                    <dt className="text-sm font-semibold">
                      {answer.questionPromptSnapshot ?? answer.question.prompt}
                    </dt>
                    <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {answer.textValue ||
                        answer.selectedOptions.join(", ") ||
                        (answer.files.length ? null : "Sin respuesta")}
                      {answer.files.length > 0 && (
                        <ul className="space-y-2">
                          {answer.files.map((file) => (
                            <li key={file.url}>
                              <a
                                href={`/api/admin/calls/files/${encodeURIComponent(file.url.split("/").pop() ?? "")}`}
                                className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                              >
                                <Download className="size-4" /> {file.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
