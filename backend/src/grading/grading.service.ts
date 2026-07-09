import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityType,
  ContentKind,
  ModuleGradeStatus,
  ModuleStatus,
  NotificationType,
  Prisma,
  RecoveryStage,
  Role,
  SubmissionStatus,
} from '@prisma/client';

const MODULE_FINISHED_MSG =
  'El módulo está concluido; no se pueden realizar cambios.';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GradeSubmissionDto, SubmitActivityDto } from './dto/grading.dto';

const studentSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class GradingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── Estudiante: entregar una actividad ──────────────────────────────────────

  async submitActivity(
    studentId: string,
    contentId: string,
    dto: SubmitActivityDto,
  ) {
    const content = await this.prisma.moduleContent.findUnique({
      where: { id: contentId },
      select: {
        kind: true,
        activityType: true,
        isPublished: true,
        dueDate: true,
        module: {
          select: {
            courseId: true,
            status: true,
            course: { select: { status: true } },
          },
        },
      },
    });
    if (
      !content ||
      content.kind !== ContentKind.ACTIVITY ||
      !content.isPublished
    ) {
      throw new NotFoundException('Actividad no encontrada');
    }
    const enrolled = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId: content.module.courseId },
      },
      select: { id: true },
    });
    if (!enrolled || content.module.course.status === 'DRAFT') {
      throw new NotFoundException('Actividad no encontrada');
    }
    // Módulo concluido → solo lectura: no se aceptan más entregas.
    if (content.module.status === ModuleStatus.FINISHED) {
      throw new ForbiddenException(MODULE_FINISHED_MSG);
    }

    const existing = await this.prisma.submission.findUnique({
      where: { contentId_studentId: { contentId, studentId } },
      select: { status: true },
    });
    if (existing?.status === SubmissionStatus.GRADED) {
      throw new BadRequestException('Tu entrega ya fue calificada');
    }

    const now = new Date();
    const status =
      content.dueDate && now > content.dueDate
        ? SubmissionStatus.LATE
        : SubmissionStatus.SUBMITTED;
    const isProject = content.activityType === ActivityType.PROJECT;

    // Proyecto → cada envío crea una NUEVA entrega en el historial (nunca
    // reemplaza las anteriores). La `Submission` conserva la nota única.
    if (isProject) {
      return this.prisma.$transaction(async (tx) => {
        const submission = await tx.submission.upsert({
          where: { contentId_studentId: { contentId, studentId } },
          create: { contentId, studentId, status, submittedAt: now },
          update: { status, submittedAt: now },
        });
        const last = await tx.projectDelivery.findFirst({
          where: { submissionId: submission.id },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        await tx.projectDelivery.create({
          data: {
            submissionId: submission.id,
            order: (last?.order ?? 0) + 1,
            text: dto.content?.trim() || null,
            files: dto.files?.length
              ? {
                  create: dto.files.map((f, i) => ({
                    order: i,
                    name: f.name,
                    url: f.url,
                    size: f.size ?? null,
                  })),
                }
              : undefined,
          },
        });
        return submission;
      });
    }

    // Tarea (ASSIGNMENT) → un texto + un archivo único; el envío reemplaza.
    const data = {
      text: dto.content?.trim() || null,
      fileUrl: dto.fileUrl?.trim() || null,
      status,
      submittedAt: now,
    };
    return this.prisma.submission.upsert({
      where: { contentId_studentId: { contentId, studentId } },
      create: { contentId, studentId, ...data },
      update: data,
    });
  }

  /**
   * Estudiante borra el archivo de su entrega. Si la entrega también tiene texto,
   * se conserva (solo se limpia el archivo); si quedaría vacía, se elimina la
   * entrega completa (vuelve a "Sin entregar"). No se permite si ya fue
   * calificada o el módulo está concluido.
   */
  async removeSubmissionFile(studentId: string, contentId: string) {
    const content = await this.prisma.moduleContent.findUnique({
      where: { id: contentId },
      select: {
        kind: true,
        isPublished: true,
        module: {
          select: {
            courseId: true,
            status: true,
            course: { select: { status: true } },
          },
        },
      },
    });
    if (
      !content ||
      content.kind !== ContentKind.ACTIVITY ||
      !content.isPublished
    ) {
      throw new NotFoundException('Actividad no encontrada');
    }
    const enrolled = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId: content.module.courseId },
      },
      select: { id: true },
    });
    if (!enrolled || content.module.course.status === 'DRAFT') {
      throw new NotFoundException('Actividad no encontrada');
    }
    if (content.module.status === ModuleStatus.FINISHED) {
      throw new ForbiddenException(MODULE_FINISHED_MSG);
    }

    const submission = await this.prisma.submission.findUnique({
      where: { contentId_studentId: { contentId, studentId } },
      select: { id: true, text: true, fileUrl: true, status: true },
    });
    if (!submission || !submission.fileUrl) {
      throw new BadRequestException('No hay archivo que borrar');
    }
    if (submission.status === SubmissionStatus.GRADED) {
      throw new BadRequestException('Tu entrega ya fue calificada');
    }

    // Si la entrega tiene texto, se conserva sin el archivo; si no, se elimina.
    if (submission.text?.trim()) {
      return this.prisma.submission.update({
        where: { id: submission.id },
        data: { fileUrl: null },
      });
    }
    await this.prisma.submission.delete({ where: { id: submission.id } });
    return { ok: true };
  }

  // ── Docente: vista de calificación de una actividad ─────────────────────────

  async getActivityGrading(teacherId: string, contentId: string) {
    const content = await this.prisma.moduleContent.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        kind: true,
        title: true,
        activityType: true,
        instructions: true,
        maxScore: true,
        weight: true,
        dueDate: true,
        recoveryStage: true,
        moduleId: true,
        module: {
          select: {
            id: true,
            name: true,
            order: true,
            status: true,
            courseId: true,
            course: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!content || content.kind !== ContentKind.ACTIVITY) {
      throw new NotFoundException('Actividad no encontrada');
    }
    await this.ensureTeaches(teacherId, content.moduleId);

    const [enrollments, submissions] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId: content.module.courseId },
        select: { student: { select: studentSelect } },
        orderBy: { student: { lastName: 'asc' } },
      }),
      this.prisma.submission.findMany({
        where: { contentId },
        select: {
          studentId: true,
          text: true,
          fileUrl: true,
          status: true,
          score: true,
          feedback: true,
          submittedAt: true,
          deliveries: {
            orderBy: { order: 'desc' },
            select: {
              order: true,
              text: true,
              createdAt: true,
              files: {
                select: { name: true, url: true, size: true },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      }),
    ]);
    const byStudent = new Map(submissions.map((s) => [s.studentId, s]));

    return {
      activity: {
        id: content.id,
        title: content.title,
        type: content.activityType,
        instructions: content.instructions,
        maxScore: content.maxScore !== null ? Number(content.maxScore) : 0,
        weight: content.weight !== null ? Number(content.weight) : 0,
        dueDate: content.dueDate,
        recoveryStage: content.recoveryStage,
        module: {
          id: content.module.id,
          name: content.module.name,
          order: content.module.order,
          status: content.module.status,
        },
        course: content.module.course,
      },
      students: enrollments.map((e) => {
        const s = byStudent.get(e.student.id);
        return {
          student: e.student,
          submission: s
            ? {
                content: s.text,
                fileUrl: s.fileUrl,
                deliveries: s.deliveries.map((d) => ({
                  order: d.order,
                  text: d.text,
                  submittedAt: d.createdAt,
                  files: d.files.map((f) => ({
                    name: f.name,
                    url: f.url,
                    size: f.size,
                  })),
                })),
                status: s.status,
                score: s.score !== null ? Number(s.score) : null,
                feedback: s.feedback,
                submittedAt: s.submittedAt,
              }
            : null,
        };
      }),
    };
  }

  // ── Docente: calificar una entrega ──────────────────────────────────────────

  async gradeSubmission(
    teacherId: string,
    contentId: string,
    studentId: string,
    dto: GradeSubmissionDto,
  ) {
    const content = await this.prisma.moduleContent.findUnique({
      where: { id: contentId },
      select: {
        kind: true,
        title: true,
        maxScore: true,
        moduleId: true,
        module: { select: { name: true, courseId: true } },
      },
    });
    if (!content || content.kind !== ContentKind.ACTIVITY) {
      throw new NotFoundException('Actividad no encontrada');
    }
    await this.ensureTeaches(teacherId, content.moduleId);
    await this.ensureModuleNotFinished(content.moduleId);

    const enrolled = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId: content.module.courseId },
      },
      select: { id: true },
    });
    if (!enrolled) {
      throw new BadRequestException('El estudiante no está inscrito');
    }
    const maxScore = content.maxScore !== null ? Number(content.maxScore) : 0;
    if (dto.score > maxScore) {
      throw new BadRequestException(`La nota no puede superar ${maxScore}`);
    }

    const data = {
      status: SubmissionStatus.GRADED,
      score: new Prisma.Decimal(dto.score),
      feedback: dto.feedback?.trim() || null,
      gradedById: teacherId,
      gradedAt: new Date(),
    };
    await this.prisma.submission.upsert({
      where: { contentId_studentId: { contentId, studentId } },
      create: { contentId, studentId, ...data },
      update: data,
    });

    await this.recomputeModuleGrade(studentId, content.moduleId, teacherId);

    await this.notifications.createMany([
      {
        userId: studentId,
        type: NotificationType.GRADE,
        title: 'Actividad calificada',
        body: `Tu actividad «${content.title}» del módulo «${content.module.name}» recibió una nota de ${dto.score}/${maxScore}.`,
        data: {
          courseId: content.module.courseId,
          moduleId: content.moduleId,
          activityId: contentId,
        },
      },
    ]);

    return { success: true };
  }

  /**
   * Puente del motor de quiz con la libreta: escribe en la `Submission` de la
   * actividad el resultado de un intento y recalcula la nota del módulo cuando
   * ya está calificado del todo. `graded=false` (hay ensayos pendientes) deja la
   * entrega en SUBMITTED sin nota; al corregir los ensayos se llama de nuevo con
   * `graded=true`. La autocalificación pasa `graderId=null`.
   */
  async applyQuizResult(
    contentId: string,
    studentId: string,
    moduleId: string,
    opts: {
      score: number;
      graded: boolean;
      feedback?: string | null;
      graderId?: string | null;
    },
  ) {
    const now = new Date();
    const data = opts.graded
      ? {
          status: SubmissionStatus.GRADED,
          score: new Prisma.Decimal(opts.score),
          feedback: opts.feedback ?? null,
          submittedAt: now,
          gradedById: opts.graderId ?? null,
          gradedAt: now,
        }
      : {
          status: SubmissionStatus.SUBMITTED,
          score: null,
          feedback: opts.feedback ?? null,
          submittedAt: now,
        };
    await this.prisma.submission.upsert({
      where: { contentId_studentId: { contentId, studentId } },
      create: { contentId, studentId, ...data },
      update: data,
    });
    // Recalcular siempre: también cuando la entrega vuelve a SUBMITTED (ensayos
    // pendientes), para que la nota del módulo no conserve el puntaje de un
    // intento anterior ya reemplazado.
    await this.recomputeModuleGrade(
      studentId,
      moduleId,
      opts.graded ? (opts.graderId ?? null) : null,
    );
  }

  // ── Recalcular la nota del módulo (ponderada por peso de actividades) ────────

  async recomputeModuleGrade(
    studentId: string,
    moduleId: string,
    gradedById: string | null,
  ) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: {
        course: { select: { passingScore: true } },
        contents: {
          where: { kind: ContentKind.ACTIVITY, isPublished: true },
          select: {
            id: true,
            maxScore: true,
            weight: true,
            recoveryStage: true,
          },
        },
      },
    });
    if (!module) return;

    // Los exámenes de recuperación NO ponderan con las demás actividades: si el
    // estudiante rindió uno (calificado), entre su nota (topeada en la nota de
    // aprobación) y la nota ponderada del módulo se queda la mayor.
    const regular = module.contents.filter((a) => a.recoveryStage === null);
    const recovery = module.contents.filter((a) => a.recoveryStage !== null);
    const recoveryScore = await this.recoveryOverride(studentId, recovery);

    const weighted = regular.filter((a) => Number(a.weight ?? 0) > 0);
    const totalWeight = weighted.reduce((s, a) => s + Number(a.weight ?? 0), 0);
    // Sin pesos no se puede ponderar (salvo que haya nota de recuperación,
    // que no depende de la ponderación).
    if (totalWeight === 0 && recoveryScore === null) return;

    const subs = await this.prisma.submission.findMany({
      where: {
        studentId,
        status: SubmissionStatus.GRADED,
        contentId: { in: weighted.map((a) => a.id) },
      },
      select: { contentId: true, score: true },
    });
    const scoreOf = new Map(
      subs.map((s) => [s.contentId, s.score !== null ? Number(s.score) : 0]),
    );

    // Cada actividad se normaliza a base 100 y pondera por su peso. Las no
    // calificadas cuentan como 0 hasta que se califiquen (la nota va subiendo).
    let acc = 0;
    let gradedCount = 0;
    for (const a of weighted) {
      const sc = scoreOf.get(a.id);
      if (sc !== undefined) {
        // maxScore null/0 → la actividad aporta 0 en vez de dividir entre cero
        // (el NaN se propagaría a finalScore y de ahí al kárdex).
        const max = Number(a.maxScore ?? 0);
        if (max > 0) acc += (sc / max) * 100 * Number(a.weight ?? 0);
        gradedCount += 1;
      }
    }
    const passing = Number(module.course.passingScore);
    let finalScore: number;
    let status: ModuleGradeStatus;
    if (recoveryScore !== null) {
      // Regla institucional: entre la nota ponderada del módulo y la de
      // recuperación se queda la MAYOR, pero la de recuperación se topea en la
      // nota mínima de aprobación asignada al programa (`course.passingScore`,
      // 71 por defecto): superar el mínimo solo es posible sin haber entrado a
      // recuperación. El módulo ya está concluido, así que aprueba/reprueba de
      // inmediato.
      const weightedScore =
        totalWeight > 0 ? Math.round((acc / totalWeight) * 100) / 100 : 0;
      finalScore = Math.max(weightedScore, Math.min(recoveryScore, passing));
      status =
        finalScore >= passing
          ? ModuleGradeStatus.PASSED
          : ModuleGradeStatus.FAILED;
    } else {
      finalScore = Math.round((acc / totalWeight) * 100) / 100;
      const allGraded = gradedCount === weighted.length;
      status = !allGraded
        ? ModuleGradeStatus.IN_PROGRESS
        : finalScore >= passing
          ? ModuleGradeStatus.PASSED
          : ModuleGradeStatus.FAILED;
    }

    await this.prisma.moduleGrade.upsert({
      where: { studentId_moduleId: { studentId, moduleId } },
      create: {
        studentId,
        moduleId,
        finalScore: new Prisma.Decimal(finalScore),
        status,
        gradedById,
        gradedAt: new Date(),
      },
      update: {
        finalScore: new Prisma.Decimal(finalScore),
        status,
        gradedById,
        gradedAt: new Date(),
      },
    });
  }

  /**
   * Nota de recuperación del estudiante en base 100, o null si no rindió
   * ninguna. Entre RECUPERATORIO y SEGUNDA_INSTANCIA se queda la MAYOR (la
   * regla final es "la nota más alta entre módulo, recuperatorio y segunda
   * instancia", con el tope de aprobación aplicado por el llamador). Solo
   * cuentan entregas GRADED (sin rendir conserva su nota original).
   */
  private async recoveryOverride(
    studentId: string,
    recovery: {
      id: string;
      maxScore: Prisma.Decimal | null;
      recoveryStage: RecoveryStage | null;
    }[],
  ): Promise<number | null> {
    if (recovery.length === 0) return null;
    const subs = await this.prisma.submission.findMany({
      where: {
        studentId,
        status: SubmissionStatus.GRADED,
        contentId: { in: recovery.map((a) => a.id) },
      },
      select: { contentId: true, score: true },
    });
    const byContent = new Map(subs.map((s) => [s.contentId, s.score]));
    const pick = (stage: RecoveryStage): number | null => {
      const content = recovery.find((a) => a.recoveryStage === stage);
      if (!content) return null;
      const score = byContent.get(content.id);
      if (score === undefined || score === null) return null;
      const max = Number(content.maxScore ?? 0);
      if (max <= 0) return null;
      return Math.round((Number(score) / max) * 100 * 100) / 100;
    };
    const scores = [
      pick(RecoveryStage.RECUPERATORIO),
      pick(RecoveryStage.SEGUNDA_INSTANCIA),
    ].filter((s): s is number => s !== null);
    return scores.length > 0 ? Math.max(...scores) : null;
  }

  /**
   * Estudiantes elegibles para rendir un examen de recuperación del módulo:
   * los que tienen nota REPROBADA. Para la SEGUNDA_INSTANCIA además deben
   * haber rendido (GRADED) el recuperatorio — es para quien lo reprobó.
   *
   * "Reprobado" = `status FAILED` o `finalScore` por debajo del mínimo aunque
   * la fila siga `IN_PROGRESS` (módulos concluidos antes de que se finalizaran
   * las notas: el examen de recuperación vive en módulos ya concluidos, así que
   * una nota bajo el mínimo es definitiva).
   */
  async recoveryEligibleStudents(
    moduleId: string,
    stage: RecoveryStage,
  ): Promise<string[]> {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: { course: { select: { passingScore: true } } },
    });
    if (!module) return [];
    const failed = await this.prisma.moduleGrade.findMany({
      where: {
        moduleId,
        OR: [
          { status: ModuleGradeStatus.FAILED },
          { finalScore: { lt: module.course.passingScore } },
        ],
      },
      select: { studentId: true },
    });
    const ids = failed.map((f) => f.studentId);
    if (stage === RecoveryStage.RECUPERATORIO || ids.length === 0) return ids;
    const rec = await this.prisma.moduleContent.findFirst({
      where: { moduleId, recoveryStage: RecoveryStage.RECUPERATORIO },
      select: { id: true },
    });
    if (!rec) return [];
    const subs = await this.prisma.submission.findMany({
      where: {
        contentId: rec.id,
        studentId: { in: ids },
        status: SubmissionStatus.GRADED,
      },
      select: { studentId: true },
    });
    return subs.map((s) => s.studentId);
  }

  /** ¿Este estudiante puede rendir el examen de recuperación de esta etapa? */
  async isRecoveryEligible(
    studentId: string,
    moduleId: string,
    stage: RecoveryStage,
  ): Promise<boolean> {
    const eligible = await this.recoveryEligibleStudents(moduleId, stage);
    return eligible.includes(studentId);
  }

  // ── Docente: libreta de calificaciones del módulo ──────────────────────────

  /**
   * Libreta del módulo: la matriz estudiantes × actividades con cada puntaje,
   * más la nota de módulo (calculada) y la observación del docente por
   * estudiante. Autoriza por docencia.
   */
  async getModuleGradebook(teacherId: string, moduleId: string) {
    await this.ensureTeaches(teacherId, moduleId);
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: {
        id: true,
        name: true,
        order: true,
        course: {
          select: {
            id: true,
            name: true,
            passingScore: true,
            enrollments: {
              select: { student: { select: studentSelect } },
              orderBy: { student: { lastName: 'asc' } },
            },
          },
        },
        contents: {
          where: { kind: ContentKind.ACTIVITY },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            maxScore: true,
            weight: true,
            isPublished: true,
            isOffline: true,
            recoveryStage: true,
          },
        },
        grades: {
          select: {
            studentId: true,
            finalScore: true,
            status: true,
            observations: true,
          },
        },
      },
    });
    if (!module) throw new NotFoundException('Módulo no encontrado');

    const activityIds = module.contents.map((c) => c.id);
    const submissions =
      activityIds.length > 0
        ? await this.prisma.submission.findMany({
            where: { contentId: { in: activityIds } },
            select: {
              contentId: true,
              studentId: true,
              score: true,
              status: true,
            },
          })
        : [];
    const subKey = (studentId: string, contentId: string) =>
      `${studentId}|${contentId}`;
    const subMap = new Map(
      submissions.map((s) => [subKey(s.studentId, s.contentId), s]),
    );
    const gradeMap = new Map(module.grades.map((g) => [g.studentId, g]));

    return {
      module: { id: module.id, name: module.name, order: module.order },
      course: {
        id: module.course.id,
        name: module.course.name,
        passingScore: Number(module.course.passingScore),
      },
      activities: module.contents.map((c) => ({
        id: c.id,
        title: c.title,
        maxScore: c.maxScore !== null ? Number(c.maxScore) : 0,
        weight: c.weight !== null ? Number(c.weight) : 0,
        isPublished: c.isPublished,
        isOffline: c.isOffline,
        recoveryStage: c.recoveryStage,
      })),
      students: module.course.enrollments.map((e) => {
        const st = e.student;
        const g = gradeMap.get(st.id);
        return {
          student: st,
          grades: module.contents.map((c) => {
            const s = subMap.get(subKey(st.id, c.id));
            return {
              activityId: c.id,
              score: s && s.score !== null ? Number(s.score) : null,
              status: s?.status ?? null,
            };
          }),
          moduleGrade: g
            ? {
                finalScore: g.finalScore !== null ? Number(g.finalScore) : null,
                status: g.status,
              }
            : null,
          observation: g?.observations ?? '',
        };
      }),
    };
  }

  /** El docente guarda/edita su observación sobre la nota de un estudiante. */
  async setModuleObservation(
    teacherId: string,
    moduleId: string,
    studentId: string,
    observations: string,
  ) {
    await this.ensureTeaches(teacherId, moduleId);
    await this.ensureModuleNotFinished(moduleId);
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: { courseId: true },
    });
    if (!module) throw new NotFoundException('Módulo no encontrado');
    const enrolled = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId: module.courseId },
      },
      select: { id: true },
    });
    if (!enrolled) {
      throw new BadRequestException('El estudiante no está inscrito');
    }
    const trimmed = observations.trim() || null;
    await this.prisma.moduleGrade.upsert({
      where: { studentId_moduleId: { studentId, moduleId } },
      create: {
        studentId,
        moduleId,
        observations: trimmed,
        gradedById: teacherId,
      },
      update: { observations: trimmed },
    });
    return { success: true };
  }

  // El docente solo califica actividades de módulos que dicta. El ADMIN puede
  // calificar cualquier módulo (igual que un docente) desde el panel.
  private async ensureTeaches(teacherId: string, moduleId: string) {
    const rel = await this.prisma.moduleTeacher.findUnique({
      where: { moduleId_teacherId: { moduleId, teacherId } },
      select: { id: true },
    });
    if (rel) return;
    const user = await this.prisma.user.findUnique({
      where: { id: teacherId },
      select: { role: true },
    });
    if (user?.role === Role.ADMIN) return;
    throw new NotFoundException('Módulo no encontrado');
  }

  // Un módulo CONCLUIDO queda en solo lectura: el docente no puede calificar
  // ni editar observaciones.
  private async ensureModuleNotFinished(moduleId: string) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: { status: true },
    });
    if (module?.status === ModuleStatus.FINISHED) {
      throw new ForbiddenException(MODULE_FINISHED_MSG);
    }
  }
}
