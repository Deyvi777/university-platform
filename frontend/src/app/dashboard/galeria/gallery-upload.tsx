"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_MB,
  MAX_VIDEO_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_MB,
  fileSizeError,
} from "@/lib/upload-limits";
import { createGalleryItemAction } from "@/app/dashboard/galeria/actions";

const VIDEO_ACCEPT = "video/mp4,video/webm,video/ogg,video/quicktime";

async function uploadFile(
  endpoint: string,
  file: File,
  extraFields: Record<string, string>,
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  for (const [key, value] of Object.entries(extraFields)) {
    form.append(key, value);
  }
  const res = await fetch(endpoint, { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    message?: string;
  };
  if (!res.ok || !data.url) {
    throw new Error(data.message ?? "Error al subir el archivo");
  }
  return data.url;
}

/**
 * Botones de carga de la galería: fotos (múltiples, hasta 5 MB c/u) y videos
 * (uno a la vez, hasta 200 MB). Cada archivo se sube al storage y se registra
 * como `GalleryItem` al final de la lista.
 */
export function GalleryUpload() {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function onPhotosSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    let created = 0;
    for (const [index, file] of list.entries()) {
      const sizeError = fileSizeError(file, MAX_IMAGE_UPLOAD_BYTES);
      if (sizeError) {
        toast.error(`${file.name}: ${sizeError}`);
        continue;
      }
      setProgress(
        list.length > 1
          ? `Subiendo foto ${index + 1} de ${list.length}…`
          : "Subiendo foto…",
      );
      try {
        const url = await uploadFile("/api/admin/upload", file, {
          folder: "gallery",
        });
        const result = await createGalleryItemAction({ type: "IMAGE", url });
        if (!result.ok) throw new Error(result.error);
        created += 1;
      } catch (error) {
        toast.error(
          `${file.name}: ${error instanceof Error ? error.message : "Error al subir"}`,
        );
      }
    }
    setProgress(null);
    if (created > 0) {
      toast.success(
        created === 1 ? "Foto agregada a la galería" : `${created} fotos agregadas`,
      );
      router.refresh();
    }
  }

  async function onVideoSelected(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const sizeError = fileSizeError(file, MAX_VIDEO_UPLOAD_BYTES);
    if (sizeError) {
      toast.error(sizeError);
      return;
    }
    setProgress("Subiendo video…");
    try {
      const url = await uploadFile("/api/admin/upload-video", file, {
        folder: "gallery-videos",
      });
      const result = await createGalleryItemAction({ type: "VIDEO", url });
      if (!result.ok) throw new Error(result.error);
      toast.success("Video agregado a la galería");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al subir el video",
      );
    } finally {
      setProgress(null);
    }
  }

  const uploading = progress !== null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void onPhotosSelected(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept={VIDEO_ACCEPT}
        className="hidden"
        onChange={(e) => {
          void onVideoSelected(e.target.files);
          e.target.value = "";
        }}
      />

      {uploading ? (
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {progress}
        </span>
      ) : (
        <>
          <Button type="button" onClick={() => photoInputRef.current?.click()}>
            <ImagePlus className="size-4" aria-hidden="true" />
            Subir fotos
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => videoInputRef.current?.click()}
          >
            <Video className="size-4" aria-hidden="true" />
            Subir video
          </Button>
          <span className="text-xs text-muted-foreground">
            Fotos hasta {MAX_IMAGE_UPLOAD_MB} MB · videos MP4/WebM/OGG/MOV hasta{" "}
            {MAX_VIDEO_UPLOAD_MB} MB
          </span>
        </>
      )}
    </div>
  );
}
