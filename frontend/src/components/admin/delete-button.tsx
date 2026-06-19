"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/app/dashboard/admin-types";

export function DeleteButton({
  action,
  confirmMessage,
}: {
  action: () => Promise<ActionResult>;
  confirmMessage: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(confirmMessage)) return;
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success("Eliminado");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={pending}
      aria-label="Eliminar"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4 text-destructive" />
      )}
    </Button>
  );
}
