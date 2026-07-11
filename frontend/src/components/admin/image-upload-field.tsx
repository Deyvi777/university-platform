"use client";

import { ImageIcon, Loader2, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  fileSizeError,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_MB,
} from "@/lib/upload-limits";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  folder: "programs" | "partners" | "team";
  /** Relación de aspecto del recuadro de previsualización. */
  variant?: "flyer" | "logo" | "portrait";
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
  const [dragOver, setDragOver] = useState(false);
  // Vista previa instantánea del archivo local mientras se sube al servidor.
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Libera el object URL al desmontar para evitar fugas de memoria.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const sizeError = fileSizeError(file, MAX_IMAGE_UPLOAD_BYTES);
    if (sizeError) {
      toast.error(sizeError);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
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
      : variant === "portrait"
        ? "aspect-[3/4] w-36"
        : "aspect-square w-32";

  return (
    <div className="flex items-start gap-4">
      {/* Dropzone: clic para elegir o arrastrar y soltar la imagen. */}
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled || uploading) return;
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        aria-label={value ? "Cambiar imagen" : "Subir imagen"}
        className={`relative flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed transition-colors ${boxClasses} ${
          dragOver
            ? "border-primary bg-primary/10"
            : "border-input hover:border-ring/60 hover:bg-accent/40"
        }`}
      >
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt="Vista previa"
            className="pointer-events-none h-full w-full object-contain"
          />
        ) : (
          <span className="pointer-events-none flex flex-col items-center gap-2 px-3 text-center text-muted-foreground">
            <ImageIcon className="size-8" />
            <span className="text-[11px] leading-tight">
              Arrastra la imagen aquí o haz clic
            </span>
          </span>
        )}
        {dragOver && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <UploadCloud className="size-7 text-primary" />
          </span>
        )}
        {uploading && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="size-6 animate-spin text-foreground" />
          </span>
        )}
      </button>

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
          Arrastra y suelta o haz clic. WEBP, PNG, JPG o AVIF. Máximo{" "}
          {MAX_IMAGE_UPLOAD_MB} MB.
        </p>
      </div>
    </div>
  );
}
