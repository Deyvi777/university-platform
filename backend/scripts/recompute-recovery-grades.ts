/**
 * Recalcula las notas de módulo afectadas por exámenes de recuperación.
 *
 * One-off tras el cambio de regla (2026-07-08): la nota final ya no es la del
 * recuperatorio/segunda instancia "pisando" la del módulo, sino LA MAYOR entre
 * {nota ponderada del módulo, recuperatorio, segunda instancia}, con las notas
 * de recuperación topeadas en la nota de aprobación del curso (71). Las notas
 * guardadas con la regla vieja pueden estar por encima del tope (recuperatorio
 * con más de 71) o por debajo de la nota original (recuperatorio peor que la
 * ponderada); este script las recalcula con la regla nueva.
 *
 * ESCRIBE en la BD (usa `GradingService.recomputeModuleGrade`, idempotente):
 * solo toca los pares estudiante×módulo con una entrega de recuperación
 * calificada. Registra cada nota antes → después.
 *
 * Uso (desde backend/): ts-node scripts/recompute-recovery-grades.ts
 */
import { NestFactory } from '@nestjs/core';
import { SubmissionStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { GradingService } from '../src/grading/grading.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);
  const grading = app.get(GradingService);

  // Pares estudiante×módulo con una recuperación rendida y calificada: son los
  // únicos cuya nota final pudo cambiar con la regla nueva.
  const subs = await prisma.submission.findMany({
    where: {
      status: SubmissionStatus.GRADED,
      content: { recoveryStage: { not: null } },
    },
    select: {
      studentId: true,
      content: { select: { moduleId: true } },
    },
  });
  const pairs = new Map<string, { studentId: string; moduleId: string }>();
  for (const s of subs) {
    const key = `${s.studentId}:${s.content.moduleId}`;
    pairs.set(key, { studentId: s.studentId, moduleId: s.content.moduleId });
  }
  console.log(
    `Pares estudiante×módulo con recuperación calificada: ${pairs.size}`,
  );

  let changed = 0;
  for (const { studentId, moduleId } of pairs.values()) {
    const before = await prisma.moduleGrade.findUnique({
      where: { studentId_moduleId: { studentId, moduleId } },
      select: { finalScore: true, status: true },
    });
    await grading.recomputeModuleGrade(studentId, moduleId, null);
    const after = await prisma.moduleGrade.findUnique({
      where: { studentId_moduleId: { studentId, moduleId } },
      select: { finalScore: true, status: true },
    });
    const fmt = (g: typeof before) =>
      g ? `${Number(g.finalScore)} (${g.status})` : '—';
    const diff =
      Number(before?.finalScore) !== Number(after?.finalScore) ||
      before?.status !== after?.status;
    if (diff) changed += 1;
    console.log(
      `${diff ? 'CAMBIÓ ' : 'igual  '} estudiante=${studentId} módulo=${moduleId}: ${fmt(before)} → ${fmt(after)}`,
    );
  }
  console.log(`Listo: ${changed} de ${pairs.size} notas cambiaron.`);
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
