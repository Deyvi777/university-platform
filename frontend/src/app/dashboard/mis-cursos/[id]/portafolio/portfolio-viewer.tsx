"use client";

import { FileText, FolderOpen } from "lucide-react";
import { useState } from "react";
import { MaterialViewer } from "@/app/dashboard/aula/[moduleId]/classroom-view";
import { cn } from "@/lib/utils";

interface PortfolioFile {
  id: string;
  name: string;
  url: string;
  size: number | null;
}

export function PortfolioViewer({ files }: { files: PortfolioFile[] }) {
  const [selectedId, setSelectedId] = useState(files[0]?.id ?? null);
  const selected = files.find((file) => file.id === selectedId) ?? files[0];

  if (!selected) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed bg-muted/20 px-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <FolderOpen className="size-7" aria-hidden="true" />
        </span>
        <div>
          <p className="font-medium">El portafolio está vacío</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando se agreguen reglamentos, cronogramas u otros documentos,
            aparecerán aquí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex w-full gap-2 overflow-x-auto pb-1">
        {files.map((file) => (
          <button
            key={file.id}
            type="button"
            onClick={() => setSelectedId(file.id)}
            className={cn(
              "flex max-w-xs shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
              file.id === selected.id
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <FileText className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{file.name}</span>
          </button>
        ))}
      </div>

      <MaterialViewer url={selected.url} title={selected.name} />
    </div>
  );
}
