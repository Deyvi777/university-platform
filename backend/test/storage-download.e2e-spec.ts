import { once } from 'node:events';
import {
  createServer,
  get,
  IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { FilesController } from '../src/storage/files.controller';
import { StorageService } from '../src/storage/storage.service';

async function waitUntil(check: () => boolean) {
  const deadline = Date.now() + 1500;
  while (!check() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  expect(check()).toBe(true);
}

describe('Descargas de almacenamiento (HTTP real + S3 local)', () => {
  let app: INestApplication;
  let s3: Server;
  let baseUrl: string;
  let storage: StorageService;
  const openDownloads = new Set<ServerResponse>();
  let s3Requests = 0;
  let uploadedBytes = 0;

  beforeAll(async () => {
    s3 = createServer((req, res) => {
      s3Requests++;
      if (req.method === 'PUT') {
        req.on('data', (chunk: Buffer) => (uploadedBytes += chunk.length));
        req.on('end', () => {
          res.writeHead(200, { ETag: '"test-etag"' });
          res.end();
        });
        return;
      }
      if (req.url?.includes('missing.txt')) {
        res.writeHead(404, { 'Content-Type': 'application/xml' });
        res.end('<Error><Code>NoSuchKey</Code></Error>');
        return;
      }
      if (req.url?.includes('complete.txt')) {
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength('Archivo completo'),
        });
        res.end('Archivo completo');
        return;
      }
      openDownloads.add(res);
      res.once('close', () => openDownloads.delete(res));
      // pending: aún no hay headers; streaming: cuerpo incompleto para simular
      // una descarga grande que el navegador cancela al cambiar de pantalla.
      if (!req.url?.includes('pending.txt')) {
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        res.write(Buffer.alloc(256 * 1024, 65));
      }
    });
    s3.listen(0, '127.0.0.1');
    await once(s3, 'listening');
    const module = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: new ConfigService({
            S3_ENDPOINT: `http://127.0.0.1:${(s3.address() as AddressInfo).port}`,
            S3_REGION: 'test',
            S3_ACCESS_KEY: 'test',
            S3_SECRET_KEY: 'test',
            S3_BUCKET: 'test',
          }),
        },
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
    storage = app.get(StorageService);
  });

  afterAll(async () => {
    await app?.close();
    s3?.closeAllConnections();
    if (s3?.listening)
      await new Promise<void>((resolve) => s3.close(() => resolve()));
  });

  it('libera S3 tras 55 descargas canceladas y permite una subida posterior', async () => {
    // Supera el pool por defecto de 50 sockets: subir después debe seguir
    // funcionando sin aumentar el pool ni reiniciar el servicio.
    for (let i = 0; i < 55; i++) {
      await new Promise<void>((resolve, reject) => {
        const req = get(`${baseUrl}/files/materials/streaming.txt`, (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            reject(new Error(`Descarga inesperada: HTTP ${res.statusCode}`));
            return;
          }
          res.once('data', () => {
            res.destroy();
            resolve();
          });
          res.on('error', () => undefined);
        });
        req.on('error', reject);
      });
      await waitUntil(() => openDownloads.size === 0);
    }
    const bytes = Buffer.from('Prueba posterior a cancelaciones');
    const uploaded = await storage.uploadDocument(
      {
        buffer: bytes,
        size: bytes.length,
        mimetype: 'text/plain',
        originalname: 'test.txt',
      },
      'submissions',
    );
    expect(uploaded.url).toMatch(/^\/files\/submissions\/.+\.txt$/);
    expect(uploadedBytes).toBe(bytes.length);
  }, 15_000);

  it('cancela S3 si el navegador se desconecta antes de recibir headers', async () => {
    const req = get(`${baseUrl}/files/materials/pending.txt`);
    req.on('error', () => undefined);
    try {
      await waitUntil(() => openDownloads.size === 1);
    } finally {
      req.destroy();
    }
    await waitUntil(() => openDownloads.size === 0);
  });

  it('conserva el contenido y tipo de una descarga completa', async () => {
    const res = await fetch(`${baseUrl}/files/materials/complete.txt`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/plain');
    expect(res.headers.get('content-length')).toBe('16');
    expect(await res.text()).toBe('Archivo completo');
  });

  it('cierra S3 y corta la descarga si el cuerpo deja de llegar', async () => {
    // Acortar solo el reloj de inactividad, conservando sockets y streams reales.
    // Se invoca con .call(this) para conservar el receptor del método original.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const setTimeout = IncomingMessage.prototype.setTimeout;
    const clock = jest
      .spyOn(IncomingMessage.prototype, 'setTimeout')
      .mockImplementation(function (
        this: IncomingMessage,
        _msecs: number,
        callback?: () => void,
      ) {
        return setTimeout.call(this, 100, callback) as IncomingMessage;
      });
    try {
      await new Promise<void>((resolve, reject) => {
        const req = get(`${baseUrl}/files/materials/streaming.txt`, (res) => {
          res.on('aborted', resolve);
          res.on('error', () => undefined);
          res.on('end', () =>
            reject(new Error('Se aceptó un archivo truncado')),
          );
          res.resume();
        });
        req.on('error', reject);
      });
      await waitUntil(() => openDownloads.size === 0);
    } finally {
      clock.mockRestore();
    }
  });

  it('mantiene 404 para objetos inexistentes', async () => {
    const res = await fetch(`${baseUrl}/files/materials/missing.txt`);
    expect(res.status).toBe(404);
    await res.arrayBuffer();
  });

  it('mantiene privados los adjuntos de convocatorias sin consultar S3', async () => {
    const before = s3Requests;
    const res = await fetch(`${baseUrl}/files/call-applications/complete.txt`);
    expect(res.status).toBe(404);
    await res.arrayBuffer();
    expect(s3Requests).toBe(before);
  });
});
