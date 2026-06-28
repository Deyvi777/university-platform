import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentKind,
  ModuleGradeStatus,
  ModuleStatus,
  NotificationType,
  Prisma,
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

  // ── Recalcular la nota del módulo (ponderada por peso de actividades) ────────

  private async recomputeModuleGrade(
    studentId: string,
    moduleId: string,
    gradedById: string,
  ) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: {
        course: { select: { passingScore: true } },
        contents: {
          where: { kind: ContentKind.ACTIVITY, isPublished: true },
          select: { id: true, maxScore: true, weight: true },
        },
      },
    });
    if (!module) return;

    const weighted = module.contents.filter((a) => Number(a.weight ?? 0) > 0);
    const totalWeight = weighted.reduce((s, a) => s + Number(a.weight ?? 0), 0);
    if (totalWeight === 0) return; // sin pesos no se puede ponderar

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
        acc += (sc / Number(a.maxScore ?? 100)) * 100 * Number(a.weight ?? 0);
        gradedCount += 1;
      }
    }
    const finalScore = Math.round((acc / totalWeight) * 100) / 100;
    const allGraded = gradedCount === weighted.length;
    const passing = Number(module.course.passingScore);
    const status: ModuleGradeStatus = !allGraded
      ? ModuleGradeStatus.IN_PROGRESS
      : finalScore >= passing
        ? ModuleGradeStatus.PASSED
        : ModuleGradeStatus.FAILED;

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
