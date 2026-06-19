"use client";

import { ImageIcon, Loader2, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  folder: "programs" | "partners";
  /** Relación de aspecto del recuadro de previsualización. */
  variant?: "flyer" | "logo";
  disabled?: boolean;
}

export function ImageUploadField({
  value,
  onChange,
  folder,
  variant = "flyer",
  disabled,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Vista previa instantánea del archivo local mientras se sube al servidor.
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Libera el object URL al desmontar para evitar fugas de memoria.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  async function handleFile(file: File) {
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.message ?? "No se pudo subir la imagen");
      }
      onChange(data.url);
      toast.success("Imagen subida");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir");
    } finally {
      setUploading(false);
      setLocalPreview(null);
      URL.revokeObjectURL(preview);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const previewSrc = localPreview ?? value;

  const boxClasses =
    variant === "flyer"
      ? "aspect-[4/5] w-40"
      : "aspect-square w-32 bg-slate-900";

  return (
    <div className="flex items-start gap-4">
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-input ${boxClasses}`}
      >
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt="Vista previa"
            className="h-full w-full object-contain"
          />
        ) : (
          <ImageIcon className="size-8 text-muted-foreground" />
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="size-6 animate-spin text-foreground" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/webp,image/png,image/jpeg,image/avif,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UploadCloud className="size-4" />
          )}
          {value ? "Cambiar imagen" : "Subir imagen"}
        </Button>
        <p className="max-w-50 text-xs text-muted-foreground">
          WEBP, PNG, JPG o AVIF. Máximo 5 MB.
        </p>
      </div>
    </div>
  );
}
