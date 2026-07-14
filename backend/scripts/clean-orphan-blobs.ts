/**
 * Limpieza de blobs huérfanos en el bucket (Garage/S3).
 *
 * Recorre los objetos bajo `submissions/` y `materials/` (las carpetas de
 * archivos subidos por estudiantes y docentes) y borra los que ya no están
 * referenciados por ninguna fila de la BD (Submission.fileUrl, SubmissionFile.url,
 * ModuleContent.url/activityFileUrl, FolderFile.url). NO toca las carpetas de la landing
 * (flyers/logos/fotos), que viven en otros prefijos.
 *
 * Uso (desde backend/):
 *   ts-node scripts/clean-orphan-blobs.ts            # dry-run (solo lista)
 *   ts-node scripts/clean-orphan-blobs.ts --delete   # borra de verdad
 */
import 'dotenv/config';
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const FILES_PREFIX = '/files/';
// Solo se barren estas carpetas (archivos de estudiantes/docentes). La landing
// (imágenes admin) usa otros prefijos y queda intacta.
const SWEPT_PREFIXES = ['submissions/', 'materials/'];

function keyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const t = url.trim();
  if (!t.startsWith(FILES_PREFIX)) return null;
  const key = t.slice(FILES_PREFIX.length);
  return key || null;
}

async function main() {
  const doDelete = process.argv.includes('--delete');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT!,
    region: process.env.S3_REGION!,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true,
  });
  const bucket = process.env.S3_BUCKET!;

  // 1. Keys referenciadas en la BD (todas las columnas que guardan /files/...).
  const [contents, courseFiles, folderFiles, submissions, submissionFiles] =
    await Promise.all([
      prisma.moduleContent.findMany({
        select: { url: true, activityFileUrl: true },
      }),
      prisma.courseFile.findMany({ select: { url: true } }),
      prisma.folderFile.findMany({ select: { url: true } }),
      prisma.submission.findMany({ select: { fileUrl: true } }),
      prisma.submissionFile.findMany({ select: { url: true } }),
    ]);

  const referenced = new Set<string>();
  for (const row of [
    ...contents.map((c) => c.url),
    ...contents.map((c) => c.activityFileUrl),
    ...courseFiles.map((f) => f.url),
    ...folderFiles.map((f) => f.url),
    ...submissions.map((s) => s.fileUrl),
    ...submissionFiles.map((f) => f.url),
  ]) {
    const key = keyFromUrl(row);
    if (key) referenced.add(key);
  }
  console.log(`Referenciados en BD: ${referenced.size} blobs`);

  // 2. Lista los objetos del bucket en los prefijos barridos (paginado).
  const allKeys: string[] = [];
  for (const prefix of SWEPT_PREFIXES) {
    let token: string | undefined;
    do {
      const res = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: token,
        }),
      );
      for (const obj of res.Contents ?? []) {
        if (obj.Key) allKeys.push(obj.Key);
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
  }
  console.log(
    `Objetos en bucket (${SWEPT_PREFIXES.join(', ')}): ${allKeys.length}`,
  );

  // 3. Huérfanos = objetos sin referencia en BD.
  const orphans = allKeys.filter((k) => !referenced.has(k));
  console.log(`\nHuérfanos encontrados: ${orphans.length}`);
  for (const key of orphans) console.log(`  - ${key}`);

  if (orphans.length === 0) {
    console.log('\nNada que borrar. ✅');
  } else if (!doDelete) {
    console.log(
      '\n(dry-run) No se borró nada. Ejecuta con --delete para eliminarlos.',
    );
  } else {
    let deleted = 0;
    for (const key of orphans) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        deleted += 1;
      } catch (e) {
        console.warn(`  ⚠ No se pudo borrar ${key}: ${String(e)}`);
      }
    }
    console.log(`\nBorrados: ${deleted}/${orphans.length} ✅`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
