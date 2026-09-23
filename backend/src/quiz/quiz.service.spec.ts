import { ConflictException, ForbiddenException } from '@nestjs/common';
import {
  ActivityType,
  ContentKind,
  ModuleStatus,
  Prisma,
  RecoveryStage,
  Role,
} from '@prisma/client';
import { GradingService } from '../grading/grading.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { QuizService } from './quiz.service';

function quizContent(opts?: {
  moduleStatus?: ModuleStatus;
  recoveryStage?: RecoveryStage | null;
}) {
  return {
    id: 'activity-1',
    kind: ContentKind.ACTIVITY,
    activityType: ActivityType.EXAM,
    title: 'Examen final',
    instructions: null,
    activityFileUrl: null,
    activityFileName: null,
    isPublished: true,
    maxScore: new Prisma.Decimal(100),
    moduleId: 'module-1',
    timeLimitMin: 60,
    availableFrom: null,
    availableUntil: null,
    singleAttempt: true,
    shuffle: false,
    revealAnswers: false,
    recoveryStage: opts?.recoveryStage ?? null,
    module: {
      status: opts?.moduleStatus ?? ModuleStatus.ACTIVE,
      courseId: 'course-1',
      course: {
        status: 'ACTIVE',
        passingScore: new Prisma.Decimal(71),
      },
    },
  };
}

function buildService(content = quizContent()) {
  const deleteAttempts = jest.fn().mockResolvedValue({ count: 2 });
  const deleteSubmission = jest.fn().mockResolvedValue({ count: 1 });
  const findSecondInstanceAttempt = jest.fn().mockResolvedValue(null);
  const findTeacherRelation = jest
    .fn()
    .mockResolvedValue({ id: 'teacher-module-1' });
  const recomputeModuleGrade = jest.fn().mockResolvedValue(undefined);
  const deleteByUrls = jest.fn().mockResolvedValue(undefined);
  const transaction = jest.fn(
    async (
      callback: (tx: {
        quizAttempt: { deleteMany: typeof deleteAttempts };
        submission: { deleteMany: typeof deleteSubmission };
      }) => Promise<number>,
    ) =>
      callback({
        quizAttempt: { deleteMany: deleteAttempts },
        submission: { deleteMany: deleteSubmission },
      }),
  );
  const prisma = {
    quizAttempt: {
      findUnique: jest.fn().mockResolvedValue({
        contentId: 'activity-1',
        studentId: 'student-1',
      }),
      findFirst: findSecondInstanceAttempt,
      findMany: jest
        .fn()
        .mockResolvedValue([
          { answers: [{ fileUrl: '/files/submissions/work.pdf' }] },
          { answers: [] },
        ]),
    },
    moduleContent: { findUnique: jest.fn().mockResolvedValue(content) },
    moduleTeacher: {
      findUnique: findTeacherRelation,
    },
    $transaction: transaction,
  } as unknown as PrismaService;
  const grading = {
    recomputeModuleGrade,
  } as unknown as GradingService;
  const storage = {
    deleteByUrls,
  } as unknown as StorageService;
  const service = new QuizService(
    prisma,
    grading,
    {} as NotificationsService,
    storage,
  );
  return {
    service,
    prisma,
    grading,
    storage,
    transaction,
    deleteAttempts,
    deleteSubmission,
    findSecondInstanceAttempt,
    findTeacherRelation,
    recomputeModuleGrade,
    deleteByUrls,
  };
}

describe('QuizService.deleteStudentAttempts', () => {
  it('borra todos los intentos del estudiante, retira la nota y limpia archivos', async () => {
    const {
      service,
      deleteAttempts,
      deleteSubmission,
      recomputeModuleGrade,
      deleteByUrls,
    } = buildService();

    await expect(
      service.deleteStudentAttempts(
        { id: 'teacher-1', role: Role.PROFESSOR },
        'attempt-2',
      ),
    ).resolves.toEqual({ success: true, deletedAttempts: 2 });

    expect(deleteAttempts).toHaveBeenCalledWith({
      where: { contentId: 'activity-1', studentId: 'student-1' },
    });
    expect(deleteSubmission).toHaveBeenCalledWith({
      where: { contentId: 'activity-1', studentId: 'student-1' },
    });
    expect(recomputeModuleGrade).toHaveBeenCalledWith(
      'student-1',
      'module-1',
      null,
    );
    expect(deleteByUrls).toHaveBeenCalledWith(['/files/submissions/work.pdf']);
  });

  it('exige borrar primero la segunda instancia antes del recuperatorio', async () => {
    const { service, transaction, deleteByUrls, findSecondInstanceAttempt } =
      buildService(
        quizContent({
          moduleStatus: ModuleStatus.FINISHED,
          recoveryStage: RecoveryStage.RECUPERATORIO,
        }),
      );
    findSecondInstanceAttempt.mockResolvedValue({ id: 'second-attempt' });

    await expect(
      service.deleteStudentAttempts(
        { id: 'teacher-1', role: Role.PROFESSOR },
        'attempt-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transaction).not.toHaveBeenCalled();
    expect(deleteByUrls).not.toHaveBeenCalled();
  });

  it('permite al ADMIN reiniciar aunque no esté asignado como docente', async () => {
    const { service, findTeacherRelation, deleteAttempts } = buildService();
    findTeacherRelation.mockResolvedValue(null);

    await expect(
      service.deleteStudentAttempts(
        { id: 'admin-1', role: Role.ADMIN },
        'attempt-2',
      ),
    ).resolves.toEqual({ success: true, deletedAttempts: 2 });

    expect(deleteAttempts).toHaveBeenCalledTimes(1);
  });

  it('no reinicia una actividad normal dentro de un módulo concluido', async () => {
    const { service, transaction } = buildService(
      quizContent({ moduleStatus: ModuleStatus.FINISHED }),
    );

    await expect(
      service.deleteStudentAttempts(
        { id: 'teacher-1', role: Role.PROFESSOR },
        'attempt-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(transaction).not.toHaveBeenCalled();
  });
});
