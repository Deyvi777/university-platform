import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

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

@Injectable()
export class StorageService {
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

  async uploadImage(
    file: UploadedFileLike,
    folder: string,
  ): Promise<{ key: string; url: string }> {
    const ext = MIME_TO_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Tipo de imagen no permitido');
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
