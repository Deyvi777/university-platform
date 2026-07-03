import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

/** Prefijo de las rutas relativas que sirve `GET /files/:folder/:filename`. */
const FILES_PREFIX = '/files/';

export interface UploadedFileLike {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const MIME_TO_EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};

export const ALLOWED_IMAGE_MIME = Object.keys(MIME_TO_EXT);

// Materiales del docente: imágenes + documentos comunes (PDF, Office, texto,
// comprimidos). Se mapea cada MIME a su extensión para nombrar el objeto.
const DOCUMENT_MIME_TO_EXT: Record<string, string> = {
  ...MIME_TO_EXT,
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'pptx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
};

export const ALLOWED_DOCUMENT_MIME = Object.keys(DOCUMENT_MIME_TO_EXT);

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.client = new S3Client({
      endpoint: this.config.getOrThrow<string>('S3_ENDPOINT'),
      region: this.config.getOrThrow<string>('S3_REGION'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('S3_ACCESS_KEY'),
        secretAccessKey: this.config.getOrThrow<string>('S3_SECRET_KEY'),
      },
      forcePathStyle: true,
    });
    this.bucket = this.config.getOrThrow<string>('S3_BUCKET');
  }

  uploadImage(file: UploadedFileLike, folder: string) {
    return this.put(file, folder, MIME_TO_EXT, 'Tipo de imagen no permitido');
  }

  uploadDocument(file: UploadedFileLike, folder: string) {
    return this.put(
      file,
      folder,
      DOCUMENT_MIME_TO_EXT,
      'Tipo de archivo no permitido',
    );
  }

  private async put(
    file: UploadedFileLike,
    folder: string,
    mimeToExt: Record<string, string>,
    rejectMessage: string,
  ): Promise<{ key: string; url: string }> {
    const ext = mimeToExt[file.mimetype];
    if (!ext) {
      throw new BadRequestException(rejectMessage);
    }

    const key = `${folder}/${randomUUID()}.${ext}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    // Ruta relativa (no acoplada al host): el frontend la sirve vía proxy a
    // /files/* y next/image puede optimizarla como imagen local.
    return { key, url: `/files/${key}` };
  }

  /**
   * Convierte una URL relativa `/files/<key>` en su key de S3, o `null` si no es
   * un blob nuestro (enlaces externos, videos de YouTube/Vimeo, `null`, etc.).
   */
  keyFromUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed.startsWith(FILES_PREFIX)) return null;
    const key = trimmed.slice(FILES_PREFIX.length);
    return key || null;
  }

  /**
   * Borra varios blobs a partir de sus URLs relativas. **Best-effort**: ignora
   * las URLs que no son nuestras, deduplica y no lanza si un objeto ya no existe
   * (solo lo registra), para que la limpieza nunca bloquee la operación de BD.
   */
  async deleteByUrls(urls: (string | null | undefined)[]): Promise<void> {
    const keys = [
      ...new Set(
        urls
          .map((u) => this.keyFromUrl(u))
          .filter((k): k is string => k !== null),
      ),
    ];
    await Promise.all(keys.map((key) => this.deleteKey(key)));
  }

  /** Borra un objeto por su key (best-effort). */
  private async deleteKey(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (error) {
      this.logger.warn(
        `No se pudo borrar el blob "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getObject(
    key: string,
  ): Promise<{ stream: Readable; contentType: string }> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        stream: res.Body as Readable,
        contentType: res.ContentType ?? 'application/octet-stream',
      };
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'NoSuchKey' || error.name === 'NotFound')
      ) {
        throw new NotFoundException('Archivo no encontrado');
      }
      throw error;
    }
  }
}
