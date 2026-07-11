// Límites de tamaño de subida (deben coincidir con los del backend):
// - documentos de docente/estudiante (`/me/uploads`): 20 MB
// - imágenes del landing del admin (`/uploads`): 5 MB

/** Límite (MB) para materiales del docente y entregas del estudiante. */
export const MAX_DOCUMENT_UPLOAD_MB = 20;
/** Límite (MB) para imágenes del landing (admin). */
export const MAX_IMAGE_UPLOAD_MB = 5;
/** Límite (MB) para el video promocional de un programa (admin). */
export const MAX_VIDEO_UPLOAD_MB = 200;

export const MAX_DOCUMENT_UPLOAD_BYTES = MAX_DOCUMENT_UPLOAD_MB * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_BYTES = MAX_IMAGE_UPLOAD_MB * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = MAX_VIDEO_UPLOAD_MB * 1024 * 1024;

/**
 * Valida el tamaño de un archivo contra un límite (en bytes). Devuelve un
 * mensaje de error claro si lo excede, o `null` si es válido.
 */
export function fileSizeError(file: File, maxBytes: number): string | null {
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return `El archivo supera el límite de ${maxMb} MB. Elige uno más pequeño.`;
  }
  return null;
}
