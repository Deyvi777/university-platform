import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentKind,
  ModuleStatus,
  NotificationType,
  Prisma,
  Role,
} from '@prisma/client';

const MODULE_FINISHED_MSG =
  'El módulo está concluido; no se pueden realizar cambios.';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateContentDto,
  ReorderContentsDto,
  UpdateContentDto,
} from './dto/module-content.dto';

// Campos de un contenido devueltos al docente (con decimales ya numéricos).
function serializeContent<
  T extends { maxScore: Prisma.Decimal | null; weight: Prisma.Decimal | null },
>(c: T) {
  return {
    ...c,
    maxScore: c.maxScore !== null ? Number(c.maxScore) : null,
    weight: c.weight !== null ? Number(c.weight) : null,
  };
}

@Injectable()
export class ModuleContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── Lectura: el módulo con todos sus contenidos (gestión del docente) ───────

  async getModule(userId: string, moduleId: string) {
    await this.ensureTeaches(userId, moduleId);
    const module = await this.prisma.courseModule.findUniqueOrThrow({
      where: { id: moduleId },
      select: {
        id: true,
        order: true,
        name: true,
        description: true,
        status: true,
        credits: true,
        course: { select: { id: true, name: true, code: true } },
        contents: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            kind: true,
            title: true,
            isPublished: true,
            body: true,
            videoUrl: true,
            materialType: true,
            url: true,
            activityType: true,
            instructions: true,
            dueDate: true,
            maxScore: true,
            weight: true,
            isOffline: true,
          },
        },
      },
    });
    return {
      ...module,
      contents: module.contents.map(serializeContent),
    };
  }

  // ── Contenidos (CRUD) ────────────────────────────────────────────────────────

  async createContent(userId: string, moduleId: string, dto: CreateContentDto) {
    await this.ensureTeaches(userId, moduleId);
    await this.ensureModuleNotFinished(moduleId);
    const last = await this.prisma.moduleContent.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const content = await this.prisma.moduleContent.create({
      data: {
        moduleId,
        order: (last?.order ?? 0) + 1,
        kind: dto.kind,
        title: dto.title,
        isPublished: dto.isPublished ?? true,
        ...this.kindData(dto),
      },
    });
    if (content.kind === ContentKind.ACTIVITY && content.isPublished) {
      await this.notifyActivityPublished(moduleId, content.id, content.title);
    }
    return serializeContent(content);
  }

  async updateContent(
    userId: string,
    contentId: string,
    dto: UpdateContentDto,
  ) {
    const existing = await this.prisma.moduleContent.findUnique({
      where: { id: contentId },
      select: { moduleId: true, kind: true, isPublished: true },
    });
    if (!existing) throw new NotFoundException('Contenido no encontrado');
    await this.ensureTeaches(userId, existing.moduleId);
    await this.ensureModuleNotFinished(existing.moduleId);

    const data: Prisma.ModuleContentUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished;
    if (dto.body !== undefined) data.body = dto.body ?? null;
    if (dto.videoUrl !== undefined) data.videoUrl = dto.videoUrl ?? null;
    if (dto.materialType !== undefined) {
      data.materialType = dto.materialType ?? null;
    }
    if (dto.url !== undefined) data.url = dto.url ?? null;
    if (dto.activityType !== undefined) {
      data.activityType = dto.activityType ?? null;
    }
    if (dto.instructions !== undefined) {
      data.instructions = dto.instructions ?? null;
    }
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.maxScore !== undefined) {
      data.maxScore =
        dto.maxScore !== null ? new Prisma.Decimal(dto.maxScore) : null;
    }
    if (dto.weight !== undefined) {
      data.weight = dto.weight !== null ? new Prisma.Decimal(dto.weight) : null;
    }

    const updated = await this.prisma.moduleContent.update({
      where: { id: contentId },
      data,
    });
    // Notificar solo en la transición borrador → publicado de una actividad.
    if (
      updated.kind === ContentKind.ACTIVITY &&
      !existing.isPublished &&
      updated.isPublished
    ) {
      await this.notifyActivityPublished(
        updated.moduleId,
        updated.id,
        updated.title,
      );
    }
    return serializeContent(updated);
  }

  async removeContent(userId: string, contentId: string) {
    const content = await this.prisma.moduleContent.findUnique({
      where: { id: contentId },
      select: { moduleId: true },
    });
    if (!content) throw new NotFoundException('Contenido no encontrado');
    await this.ensureTeaches(userId, content.moduleId);
    await this.ensureModuleNotFinished(content.moduleId);
    await this.prisma.moduleContent.delete({ where: { id: contentId } });
    return { success: true };
  }

  /**
   * Reordena los contenidos del módulo según `orderedIds`. El nuevo orden es el
   * que verá el estudiante en el temario. Se hace en dos pasadas (offset
   * temporal alto) para no chocar con `@@unique([moduleId, order])`.
   */
  async reorderContents(
    userId: string,
    moduleId: string,
    dto: ReorderContentsDto,
  ) {
    await this.ensureTeaches(userId, moduleId);
    await this.ensureModuleNotFinished(moduleId);
    const current = await this.prisma.moduleContent.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
      select: { id: true },
    });
    const currentIds = current.map((c) => c.id);
    const currentSet = new Set(currentIds);
    // Acepta una lista PARCIAL (p.ej. solo los contenidos visibles del temario;
    // las actividades presenciales se ocultan de él). Los ids provistos van
    // primero en el orden dado; los demás se mantienen detrás, en su orden actual.
    const provided = dto.orderedIds.filter((id) => currentSet.has(id));
    const providedSet = new Set(provided);
    const rest = currentIds.filter((id) => !providedSet.has(id));
    const finalOrder = [...provided, ...rest];

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < finalOrder.length; i++) {
        await tx.moduleContent.update({
          where: { id: finalOrder[i] },
          data: { order: 1000 + i },
        });
      }
      for (let i = 0; i < finalOrder.length; i++) {
        await tx.moduleContent.update({
          where: { id: finalOrder[i] },
          data: { order: i + 1 },
        });
      }
    });
    return { success: true };
  }

  // ── Vista de aprendizaje del estudiante ──────────────────────────────────────

  /**
   * Módulo en modo "aula" para el estudiante inscrito: sus contenidos publicados
   * en orden, con —para actividades— su entrega, y para cada uno si lo marcó
   * como completado. Autoriza por inscripción; si no, 404.
   */
  async getModuleForStudent(studentId: string, moduleId: string) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: {
        id: true,
        order: true,
        name: true,
        description: true,
        status: true,
        courseId: true,
        course: { select: { id: true, name: true, code: true, status: true } },
        teachers: {
          orderBy: { assignedAt: 'asc' },
          select: { teacher: { select: { firstName: true, lastName: true } } },
        },
        grades: {
          where: { studentId },
          select: { finalScore: true, status: true, observations: true },
        },
        contents: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            kind: true,
            title: true,
            body: true,
            videoUrl: true,
            materialType: true,
            url: true,
            activityType: true,
            instructions: true,
            dueDate: true,
            maxScore: true,
            weight: true,
            isOffline: true,
            submissions: {
              where: { studentId },
              select: {
                text: true,
                fileUrl: true,
                status: true,
                score: true,
                feedback: true,
                submittedAt: true,
              },
            },
            progress: { where: { studentId }, select: { completed: true } },
          },
        },
      },
    });
    if (!module) throw new NotFoundException('Módulo no encontrado');

    const enrolled = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: module.courseId } },
      select: { id: true },
    });
    // Sin inscripción, curso en borrador o módulo en borrador → no visible.
    if (
      !enrolled ||
      module.course.status === 'DRAFT' ||
      module.status === 'DRAFT'
    ) {
      throw new NotFoundException('Módulo no encontrado');
    }

    const grade = module.grades[0];

    return {
      id: module.id,
      order: module.order,
      name: module.name,
      description: module.description,
      status: module.status,
      course: {
        id: module.course.id,
        name: module.course.name,
        code: module.course.code,
      },
      teachers: module.teachers.map((t) => t.teacher),
      grade: grade
        ? {
            finalScore:
              grade.finalScore !== null ? Number(grade.finalScore) : null,
            status: grade.status,
            observations: grade.observations,
          }
        : null,
      contents: module.contents.map((c) => {
        const sub = c.submissions[0];
        return {
          id: c.id,
          order: c.order,
          kind: c.kind,
          title: c.title,
          body: c.body,
          videoUrl: c.videoUrl,
          materialType: c.materialType,
          url: c.url,
          activityType: c.activityType,
          instructions: c.instructions,
          dueDate: c.dueDate,
          maxScore: c.maxScore !== null ? Number(c.maxScore) : null,
          weight: c.weight !== null ? Number(c.weight) : null,
          isOffline: c.isOffline,
          completed: c.progress[0]?.completed ?? false,
          submission: sub
            ? {
                content: sub.text,
                fileUrl: sub.fileUrl,
                status: sub.status,
                score: sub.score !== null ? Number(sub.score) : null,
                feedback: sub.feedback,
                submittedAt: sub.submittedAt,
              }
            : null,
        };
      }),
    };
  }

  /** Marca/desmarca un contenido como completado (estudiante inscrito). */
  async setContentProgress(
    studentId: string,
    contentId: string,
    completed: boolean,
  ) {
    await this.ensureEnrolledInContent(studentId, contentId);
    await this.ensureContentModuleNotFinished(contentId);
    const completedAt = completed ? new Date() : null;
    await this.prisma.contentProgress.upsert({
      where: { studentId_contentId: { studentId, contentId } },
      create: { studentId, contentId, completed, completedAt },
      update: { completed, completedAt },
    });
    return { completed };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  // Mapea los campos específicos del tipo al crear (limpia los que no aplican).
  private kindData(
    dto: CreateContentDto,
  ): Partial<Prisma.ModuleContentUncheckedCreateInput> {
    const data: Partial<Prisma.ModuleContentUncheckedCreateInput> = {};
    switch (dto.kind) {
      case 'TEXT':
        data.body = dto.body ?? null;
        break;
      case 'VIDEO':
        data.videoUrl = dto.videoUrl ?? null;
        break;
      case 'MATERIAL':
        data.materialType = dto.materialType ?? 'LINK';
        data.url = dto.url ?? null;
        break;
      case 'ACTIVITY':
        data.activityType = dto.activityType ?? 'ASSIGNMENT';
        data.instructions = dto.instructions ?? null;
        data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
        data.maxScore = new Prisma.Decimal(dto.maxScore ?? 100);
        data.weight = new Prisma.Decimal(dto.weight ?? 0);
        data.isOffline = dto.isOffline ?? false;
        break;
    }
    return data;
  }

  // Notifica a los estudiantes inscritos que hay una actividad nueva disponible.
  private async notifyActivityPublished(
    moduleId: string,
    contentId: string,
    activityTitle: string,
  ) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: {
        name: true,
        courseId: true,
        course: {
          select: {
            name: true,
            enrollments: { select: { studentId: true } },
          },
        },
      },
    });
    if (!module || module.course.enrollments.length === 0) return;

    await this.notifications.createMany(
      module.course.enrollments.map((e) => ({
        userId: e.studentId,
        type: NotificationType.ACTIVITY_PUBLISHED,
        title: 'Nueva actividad',
        body: `Hay una nueva actividad «${activityTitle}» en el módulo «${module.name}» del programa «${module.course.name}».`,
        data: { courseId: module.courseId, moduleId, activityId: contentId },
      })),
    );
  }

  // El docente solo gestiona módulos que dicta. Si no lo dicta (o no existe),
  // 404 — sin revelar la existencia del módulo. El ADMIN puede gestionar
  // cualquier módulo (igual que un docente) desde el panel de programas.
  private async ensureTeaches(userId: string, moduleId: string) {
    const rel = await this.prisma.moduleTeacher.findUnique({
      where: { moduleId_teacherId: { moduleId, teacherId: userId } },
      select: { id: true },
    });
    if (rel) return;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === Role.ADMIN) return;
    throw new NotFoundException('Módulo no encontrado');
  }

  // Un módulo CONCLUIDO (FINISHED) queda en solo lectura: ni docente ni
  // estudiante pueden modificar contenidos, notas, apuntes ni entregas.
  private async ensureModuleNotFinished(moduleId: string) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: { status: true },
    });
    if (module?.status === ModuleStatus.FINISHED) {
      throw new ForbiddenException(MODULE_FINISHED_MSG);
    }
  }

  // Igual que el anterior pero resolviendo el módulo a partir del contenido.
  private async ensureContentModuleNotFinished(contentId: string) {
    const content = await this.prisma.moduleContent.findUnique({
      where: { id: contentId },
      select: { module: { select: { status: true } } },
    });
    if (content?.module.status === ModuleStatus.FINISHED) {
      throw new ForbiddenException(MODULE_FINISHED_MSG);
    }
  }

  // El estudiante solo opera contenidos de cursos en los que está inscrito.
  private async ensureEnrolledInContent(studentId: string, contentId: string) {
    const content = await this.prisma.moduleContent.findUnique({
      where: { id: contentId },
      select: { module: { select: { courseId: true } } },
    });
    if (!content) throw new NotFoundException('Contenido no encontrado');
    const enrolled = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId: content.module.courseId },
      },
      select: { id: true },
    });
    if (!enrolled) throw new NotFoundException('Contenido no encontrado');
  }
}
