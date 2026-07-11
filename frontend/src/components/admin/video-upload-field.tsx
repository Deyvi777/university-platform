"use client";

import { Film, Loader2, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  fileSizeError,
  MAX_VIDEO_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_MB,
} from "@/lib/upload-limits";

interface VideoUploadFieldProps {
  /** Ruta `/files/...` del video subido, o "" si no hay. */
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

/**
 * Dropzone para subir el video promocional del programa (arrastrar/soltar o
 * clic). Sube a `/api/admin/upload-video` y guarda la ruta relativa `/files/...`.
 * Si ya hay un video subido, muestra una vista previa reproducible.
 */
export function VideoUploadField({
  value,
  onChange,
  disabled,
}: VideoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Solo se previsualiza un archivo subido (/files/...), no un enlace externo.
  const uploadedSrc = value.startsWith("/files/") ? value : "";

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("El archivo debe ser un video (MP4, WebM, OGG o MOV)");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const sizeError = fileSizeError(file, MAX_VIDEO_UPLOAD_BYTES);
    if (sizeError) {
      toast.error(sizeError);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload-video", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.message ?? "No se pudo subir el video");
      }
      onChange(data.url);
      toast.success("Video subido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (uploadedSrc) {
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-lg border bg-black">
          <video
            src={uploadedSrc}
            controls
            className="max-h-64 w-full"
            preload="metadata"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange("")}
        >
          <X className="size-4" /> Quitar video
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
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
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/10"
            : "border-input hover:border-ring/60 hover:bg-accent/40"
        } ${disabled || uploading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
      >
        {uploading ? (
          <Loader2 className="size-7 animate-spin text-foreground" />
        ) : (
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Film className="size-5" />
          </span>
        )}
        <span className="text-sm font-medium">
          {uploading ? "Subiendo video…" : "Arrastra el video aquí o haz clic"}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <UploadCloud className="size-3.5" />
          MP4, WebM, OGG o MOV. Máximo {MAX_VIDEO_UPLOAD_MB} MB.
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
