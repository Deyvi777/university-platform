import { RequestTimeoutException, StreamableFile } from '@nestjs/common';
import type { ServerResponse } from 'node:http';
import type { Readable } from 'node:stream';
import type { StorageService } from './storage.service';

/** Propaga la desconexión del cliente hasta la petición y el stream de S3. */
export async function streamStoredFile(
  storage: StorageService,
  key: string,
  response: ServerResponse,
): Promise<StreamableFile> {
  const controller = new AbortController();
  let stream: Readable | undefined;
  const release = () => {
    controller.abort();
    stream?.destroy();
  };
  const cleanup = () => response.off('close', release);

  // Registrar antes del await: el cliente puede irse mientras S3 responde
  // o mientras la petición todavía espera un socket disponible.
  response.once('close', release);
  if (response.destroyed) release();
  try {
    const object = await storage.getObject(key, controller.signal);
    stream = object.stream;
    if (controller.signal.aborted || response.destroyed) {
      throw new RequestTimeoutException('Descarga cancelada');
    }
    stream.once('close', cleanup);
    return new StreamableFile(stream, {
      type: object.contentType,
      length: object.contentLength,
    }).setErrorHandler((error: Error) => {
      // Un fallo a mitad del cuerpo debe interrumpir la descarga; terminar
      // limpiamente la respuesta haría pasar un archivo truncado por completo.
      response.destroy(error);
    });
  } catch (error) {
    cleanup();
    release();
    if (response.destroyed) {
      throw new RequestTimeoutException('Descarga cancelada');
    }
    throw error;
  }
}
