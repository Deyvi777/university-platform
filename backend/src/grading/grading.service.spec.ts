import { ModuleGradeStatus, Prisma, RecoveryStage } from '@prisma/client';
import { GradingService } from './grading.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Regla institucional del recuperatorio / segunda instancia:
 * la nota final del módulo es LA MAYOR entre {nota ponderada, recuperatorio,
 * segunda instancia}, con las notas de recuperación topeadas en la nota
 * mínima de aprobación asignada al programa (`course.passingScore`, 71 por
 * defecto). Superar el mínimo solo es posible sin entrar a recuperación.
 */
describe('GradingService.recomputeModuleGrade (regla de recuperación)', () => {
  const PASSING = 71;

  // Actividad regular única (peso 100, sobre 100) + exámenes de recuperación
  // opcionales; los puntajes llegan por `subs` (entregas GRADED).
  function build(opts: {
    weightedScore: number;
    recuperatorio?: number;
    segunda?: number;
    passing?: number;
  }) {
    const contents = [
      { id: 'act', maxScore: 100, weight: 100, recoveryStage: null },
    ] as {
      id: string;
      maxScore: number | null;
      weight: number | null;
      recoveryStage: RecoveryStage | null;
    }[];
    const subs = [{ contentId: 'act', score: opts.weightedScore }];
    if (opts.recuperatorio !== undefined) {
      contents.push({
        id: 'rec',
        maxScore: 100,
        weight: 0,
        recoveryStage: RecoveryStage.RECUPERATORIO,
      });
      subs.push({ contentId: 'rec', score: opts.recuperatorio });
    }
    if (opts.segunda !== undefined) {
      contents.push({
        id: 'seg',
        maxScore: 100,
        weight: 0,
        recoveryStage: RecoveryStage.SEGUNDA_INSTANCIA,
      });
      subs.push({ contentId: 'seg', score: opts.segunda });
    }

    const upsert = jest.fn().mockResolvedValue({});
    const prisma = {
      courseModule: {
        findUnique: jest.fn().mockResolvedValue({
          course: {
            passingScore: new Prisma.Decimal(opts.passing ?? PASSING),
          },
          contents,
        }),
      },
      submission: {
        findMany: jest
          .fn()
          .mockImplementation(
            ({ where }: { where: { contentId: { in: string[] } } }) =>
              Promise.resolve(
                subs.filter((s) => where.contentId.in.includes(s.contentId)),
              ),
          ),
      },
      moduleGrade: { upsert },
    } as unknown as PrismaService;
    const service = new GradingService(prisma, {} as NotificationsService);
    return { service, upsert };
  }

  async function finalGrade(opts: Parameters<typeof build>[0]) {
    const { service, upsert } = build(opts);
    await service.recomputeModuleGrade('student', 'module', null);
    const [args] = upsert.mock.calls[0] as [
      { update: { finalScore: Prisma.Decimal; status: ModuleGradeStatus } },
    ];
    const data = args.update;
    return { score: Number(data.finalScore), status: data.status };
  }

  it('sin recuperación conserva la nota ponderada (puede superar 71)', async () => {
    expect(await finalGrade({ weightedScore: 90 })).toEqual({
      score: 90,
      status: ModuleGradeStatus.PASSED,
    });
  });

  it('recuperatorio > 71 se topea en 71', async () => {
    expect(await finalGrade({ weightedScore: 60, recuperatorio: 95 })).toEqual({
      score: 71,
      status: ModuleGradeStatus.PASSED,
    });
  });

  it('recuperatorio aprobado con menos de 71 queda tal cual', async () => {
    // 71 exacto aprueba; bajo el mínimo la nota mayor manda (ver siguientes).
    expect(await finalGrade({ weightedScore: 60, recuperatorio: 71 })).toEqual({
      score: 71,
      status: ModuleGradeStatus.PASSED,
    });
  });

  it('recuperatorio peor que la nota del módulo no la baja', async () => {
    expect(await finalGrade({ weightedScore: 65, recuperatorio: 40 })).toEqual({
      score: 65,
      status: ModuleGradeStatus.FAILED,
    });
  });

  it('recuperatorio mejor pero reprobado sube la nota sin aprobar', async () => {
    expect(await finalGrade({ weightedScore: 50, recuperatorio: 68 })).toEqual({
      score: 68,
      status: ModuleGradeStatus.FAILED,
    });
  });

  it('entre recuperatorio y segunda instancia gana la mayor (con tope)', async () => {
    expect(
      await finalGrade({ weightedScore: 50, recuperatorio: 68, segunda: 90 }),
    ).toEqual({ score: 71, status: ModuleGradeStatus.PASSED });
  });

  it('segunda instancia peor que el recuperatorio no lo pisa', async () => {
    expect(
      await finalGrade({ weightedScore: 50, recuperatorio: 65, segunda: 55 }),
    ).toEqual({ score: 65, status: ModuleGradeStatus.FAILED });
  });

  it('el tope sigue la nota mínima de aprobación del programa (no un 71 fijo)', async () => {
    // Programa con mínimo 60: un recuperatorio de 85 figura 60 (aprobado)…
    expect(
      await finalGrade({ weightedScore: 40, recuperatorio: 85, passing: 60 }),
    ).toEqual({ score: 60, status: ModuleGradeStatus.PASSED });
    // …y con mínimo 80, un recuperatorio de 85 figura 80.
    expect(
      await finalGrade({ weightedScore: 40, recuperatorio: 85, passing: 80 }),
    ).toEqual({ score: 80, status: ModuleGradeStatus.PASSED });
  });
});
