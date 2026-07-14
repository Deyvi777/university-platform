import {
  BadRequestException,
  ConflictException,
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
  RecoveryStage,
  Role,
  SubmissionStatus,
} from '@prisma/client';

const MODULE_FINISHED_MSG =
  'El módulo está concluido; no se pueden realizar cambios.';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GradingService } from '../grading/grading.service';
import { StorageService } from '../storage/storage.service';
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
    private readonly grading: GradingService,
    private readonly storage: StorageService,
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
            activityFileUrl: true,
            activityFileName: true,
            dueDate: true,
            maxScore: true,
            weight: true,
            isOffline: true,
            recoveryStage: true,
            timeLimitMin: true,
            availableFrom: true,
            availableUntil: true,
            singleAttempt: true,
            shuffle: true,
            revealAnswers: true,
            folderFiles: {
              orderBy: { order: 'asc' },
              select: { id: true, name: true, url: true, size: true },
            },
            _count: { select: { submissions: true } },
          },
        },
      },
    });
    return {
      ...module,
      contents: module.contents.map(({ _count, ...c }) => ({
        ...serializeContent(c),
        // Entregas del estudiante (para avisar antes de borrar la actividad).
        submissionCount: _count.submissions,
      })),
    };
  }

  // ── Contenidos (CRUD) ────────────────────────────────────────────────────────

  async createContent(userId: string, moduleId: string, dto: CreateContentDto) {
    await this.ensureTeaches(userId, moduleId);
    if (dto.recoveryStage) {
      // Los exámenes de recuperación son la excepción al bloqueo del módulo
      // concluido: justamente se habilitan sobre un módulo FINISHED.
      await this.validateRecoveryCreate(userId, moduleId, dto);
    } else {
      await this.ensureModuleNotFinished(moduleId);
    }
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
        recoveryStage: dto.recoveryStage ?? null,
        ...this.kindData(dto),
        ...(dto.kind === 'FOLDER' && dto.files?.length
          ? {
              folderFiles: {
                create: dto.files.map((f, i) => ({
                  order: i,
                  name: f.name,
                  url: f.url,
                  size: f.size ?? null,
                })),
              },
            }
          : {}),
      },
      include: { folderFiles: { orderBy: { order: 'asc' } } },
    });
    if (content.kind === ContentKind.ACTIVITY && content.isPublished) {
      if (content.recoveryStage) {
        // Solo a los estudiantes elegibles (reprobados), no a todo el curso.
        await this.notifyRecoveryPublished(
          moduleId,
          content.id,
          content.title,
          content.recoveryStage,
        );
      } else {
        await this.notifyActivityPublished(moduleId, content.id, content.title);
      }
    }
    return serializeContent(content);
  }

  /**
   * Valida la creación de un examen de recuperación: módulo CONCLUIDO, tipo
   * QUIZ/EXAM, único por etapa, SEGUNDA_INSTANCIA solo por el ADMIN y solo si
   * ya existe el RECUPERATORIO (es para quien lo reprobó).
   */
  private async validateRecoveryCreate(
    userId: string,
    moduleId: string,
    dto: CreateContentDto,
  ) {
    if (
      dto.kind !== 'ACTIVITY' ||
      (dto.activityType !== 'QUIZ' && dto.activityType !== 'EXAM')
    ) {
      throw new BadRequestException(
        'Un examen de recuperación debe ser una actividad de tipo cuestionario o examen',
      );
    }
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: { status: true },
    });
    if (module?.status !== ModuleStatus.FINISHED) {
      throw new BadRequestException(
        'El examen de recuperación se habilita cuando el módulo está concluido',
      );
    }
    if (dto.recoveryStage === 'SEGUNDA_INSTANCIA') {
      await this.ensureAdmin(
        userId,
        'Solo un administrador puede habilitar la segunda instancia',
      );
      const rec = await this.prisma.moduleContent.findFirst({
        where: { moduleId, recoveryStage: RecoveryStage.RECUPERATORIO },
        select: { id: true },
      });
      if (!rec) {
        throw new BadRequestException(
          'La segunda instancia requiere que exista un recuperatorio en el módulo',
        );
      }
    }
    const existing = await this.prisma.moduleContent.findFirst({
      where: { moduleId, recoveryStage: dto.recoveryStage },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        dto.recoveryStage === 'SEGUNDA_INSTANCIA'
          ? 'El módulo ya tiene una segunda instancia'
          : 'El módulo ya tiene un recuperatorio',
      );
    }
  }

  async updateContent(
    userId: string,
    contentId: string,
    dto: UpdateContentDto,
  ) {
    const existing = await this.prisma.moduleContent.findUnique({
      where: { id: contentId },
      select: {
        moduleId: true,
        kind: true,
        isPublished: true,
        weight: true,
        maxScore: true,
        recoveryStage: true,
        activityFileUrl: true,
      },
    });
    if (!existing) throw new NotFoundException('Contenido no encontrado');
    await this.ensureTeaches(userId, existing.moduleId);
    if (existing.recoveryStage) {
      // Un examen de recuperación vive en un módulo concluido: se puede editar
      // igual. La segunda instancia solo la gestiona el admin.
      if (existing.recoveryStage === RecoveryStage.SEGUNDA_INSTANCIA) {
        await this.ensureAdmin(
          userId,
          'Solo un administrador puede editar la segunda instancia',
        );
      }
    } else {
      await this.ensureModuleNotFinished(existing.moduleId);
    }

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
    if (dto.activityFileUrl !== undefined) {
      data.activityFileUrl = dto.activityFileUrl ?? null;
    }
    if (dto.activityFileName !== undefined) {
      data.activityFileName = dto.activityFileName ?? null;
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
    // Ajustes del motor de preguntas (QUIZ/EXAM).
    if (dto.timeLimitMin !== undefined) {
      data.timeLimitMin = dto.timeLimitMin ?? null;
    }
    if (dto.availableFrom !== undefined) {
      data.availableFrom = dto.availableFrom
        ? new Date(dto.availableFrom)
        : null;
    }
    if (dto.availableUntil !== undefined) {
      data.availableUntil = dto.availableUntil
        ? new Date(dto.availableUntil)
        : null;
    }
    if (dto.singleAttempt !== undefined)
      data.singleAttempt = dto.singleAttempt ?? null;
    if (dto.shuffle !== undefined) data.shuffle = dto.shuffle ?? null;
    if (dto.revealAnswers !== undefined) {
      data.revealAnswers = dto.revealAnswers ?? null;
    }
    // FOLDER: reemplaza la lista completa de archivos (borra los actuales y
    // recrea desde la lista enviada).
    if (dto.files !== undefined) {
      data.folderFiles = {
        deleteMany: {},
        create: (dto.files ?? []).map((f, i) => ({
          order: i,
          name: f.name,
          url: f.url,
          size: f.size ?? null,
        })),
      };
    }

    const updated = await this.prisma.moduleContent.update({
      where: { id: contentId },
      data,
      include: { folderFiles: { orderBy: { order: 'asc' } } },
    });
    if (
      dto.activityFileUrl !== undefined &&
      existing.activityFileUrl &&
      existing.activityFileUrl !== updated.activityFileUrl
    ) {
      await this.storage.deleteByUrls([existing.activityFileUrl]);
    }
    // Notificar solo en la transición borrador → publicado de una actividad.
    if (
      updated.kind === ContentKind.ACTIVITY &&
      !existing.isPublished &&
      updated.isPublished
    ) {
      if (updated.recoveryStage) {
        // Recuperación: solo a los estudiantes elegibles, no a todo el curso.
        await this.notifyRecoveryPublished(
          updated.moduleId,
          updated.id,
          updated.title,
          updated.recoveryStage,
        );
      } else {
        await this.notifyActivityPublished(
          updated.moduleId,
          updated.id,
          updated.title,
        );
      }
    }
    // Si cambió algo que altera la ponderación de la nota del módulo
    // (publicación, peso o puntaje máximo de una actividad), recalcular la
    // nota de los estudiantes ya calificados — igual que removeContent, que
    // recalcula al desaparecer una actividad ponderada.
    if (updated.kind === ContentKind.ACTIVITY) {
      const gradingChanged =
        (dto.isPublished !== undefined &&
          dto.isPublished !== existing.isPublished) ||
        (dto.weight !== undefined &&
          Number(dto.weight ?? 0) !== Number(existing.weight ?? 0)) ||
        (dto.maxScore !== undefined &&
          Number(dto.maxScore ?? 0) !== Number(existing.maxScore ?? 0));
      if (gradingChanged) {
        const affected = await this.prisma.moduleGrade.findMany({
          where: { moduleId: existing.moduleId },
          select: { studentId: true },
        });
        for (const { studentId } of affected) {
          await this.grading.recomputeModuleGrade(
            studentId,
            existing.moduleId,
            null,
          );
        }
      }
    }
    return serializeContent(updated);
  }

  async removeContent(userId: string, contentId: string) {
    // Traemos, antes de borrar, todo lo que el borrado en cascada eliminará:
    // los archivos físicos referenciados (material/carpeta/entregas) para
    // limpiarlos del bucket, y los estudiantes con nota de módulo para
    // recalcularla (una actividad evaluable borrada cambia la ponderación).
    const content = await this.prisma.moduleContent.findUnique({
      where: { id: contentId },
      select: {
        moduleId: true,
        kind: true,
        recoveryStage: true,
        url: true, // MATERIAL (FILE) → ruta /files/...
        activityFileUrl: true, // ACTIVITY → instrucciones/material adjunto
        folderFiles: { select: { url: true } }, // FOLDER
        submissions: {
          select: {
            fileUrl: true, // Tarea
            deliveries: { select: { files: { select: { url: true } } } }, // Proyecto
          },
        },
      },
    });
    if (!content) throw new NotFoundException('Contenido no encontrado');
    await this.ensureTeaches(userId, content.moduleId);
    if (content.recoveryStage) {
      // Borrable aunque el módulo esté concluido; al borrarlo la nota vuelve a
      // la ponderada original (recompute más abajo). Segunda instancia: admin.
      if (content.recoveryStage === RecoveryStage.SEGUNDA_INSTANCIA) {
        await this.ensureAdmin(
          userId,
          'Solo un administrador puede eliminar la segunda instancia',
        );
      }
    } else {
      await this.ensureModuleNotFinished(content.moduleId);
    }

    // Reúne todas las URLs de blobs propios que quedarán sin referencia.
    const blobUrls = [
      content.url,
      content.activityFileUrl,
      ...content.folderFiles.map((f) => f.url),
      ...content.submissions.flatMap((s) => [
        s.fileUrl,
        ...s.deliveries.flatMap((d) => d.files.map((f) => f.url)),
      ]),
    ];

    const isActivity = content.kind === ContentKind.ACTIVITY;
    // Estudiantes con nota en el módulo (los únicos con finalScore que puede
    // quedar obsoleto al desaparecer una actividad ponderada).
    const affectedStudents = isActivity
      ? await this.prisma.moduleGrade.findMany({
          where: { moduleId: content.moduleId },
          select: { studentId: true },
        })
      : [];

    await this.prisma.moduleContent.delete({ where: { id: contentId } });

    // Recalcula la nota de módulo de cada estudiante afectado sobre las
    // actividades restantes (recompute del sistema → gradedById null).
    if (isActivity) {
      for (const { studentId } of affectedStudents) {
        await this.grading.recomputeModuleGrade(
          studentId,
          content.moduleId,
          null,
        );
      }
    }

    // Limpieza best-effort de los blobs huérfanos (después del commit de BD).
    await this.storage.deleteByUrls(blobUrls);

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
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            passingScore: true,
          },
        },
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
            activityFileUrl: true,
            activityFileName: true,
            dueDate: true,
            maxScore: true,
            weight: true,
            isOffline: true,
            recoveryStage: true,
            folderFiles: {
              orderBy: { order: 'asc' },
              select: { id: true, name: true, url: true, size: true },
            },
            submissions: {
              where: { studentId },
              select: {
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

    // Exámenes de recuperación: visibles solo para el estudiante elegible
    // (reprobado) o el que ya lo rindió. La segunda instancia exige además
    // haber rendido (GRADED) el recuperatorio. Los demás no los ven.
    // "Reprobado" = FAILED o nota bajo el mínimo aunque siga IN_PROGRESS
    // (módulos concluidos antes de finalizar las notas) — mismo criterio que
    // `GradingService.recoveryEligibleStudents`.
    const failed =
      grade != null &&
      (grade.status === ModuleGradeStatus.FAILED ||
        (grade.finalScore != null &&
          Number(grade.finalScore) < Number(module.course.passingScore)));
    const recContent = module.contents.find(
      (c) => c.recoveryStage === RecoveryStage.RECUPERATORIO,
    );
    const tookRecuperatorio =
      recContent?.submissions[0]?.status === SubmissionStatus.GRADED;
    const visibleContents = module.contents.filter((c) => {
      if (!c.recoveryStage) return true;
      if (c.submissions.length > 0) return true; // ya lo rindió → siempre visible
      if (!failed) return false;
      if (c.recoveryStage === RecoveryStage.RECUPERATORIO) return true;
      return tookRecuperatorio; // SEGUNDA_INSTANCIA
    });

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
      contents: visibleContents.map((c) => {
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
          activityFileUrl: c.activityFileUrl,
          activityFileName: c.activityFileName,
          dueDate: c.dueDate,
          maxScore: c.maxScore !== null ? Number(c.maxScore) : null,
          weight: c.weight !== null ? Number(c.weight) : null,
          isOffline: c.isOffline,
          recoveryStage: c.recoveryStage,
          folderFiles: c.folderFiles,
          completed: c.progress[0]?.completed ?? false,
          submission: sub
            ? {
                content: sub.text,
                fileUrl: sub.fileUrl,
                deliveries: sub.deliveries.map((d) => ({
                  order: d.order,
                  text: d.text,
                  submittedAt: d.createdAt,
                  files: d.files.map((f) => ({
                    name: f.name,
                    url: f.url,
                    size: f.size,
                  })),
                })),
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
        data.activityFileUrl = dto.activityFileUrl ?? null;
        data.activityFileName = dto.activityFileName ?? null;
        data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
        data.maxScore = new Prisma.Decimal(dto.maxScore ?? 100);
        data.weight = new Prisma.Decimal(dto.weight ?? 0);
        data.isOffline = dto.isOffline ?? false;
        // Ajustes del motor de preguntas (QUIZ/EXAM); null en los demás tipos.
        data.timeLimitMin = dto.timeLimitMin ?? null;
        data.availableFrom = dto.availableFrom
          ? new Date(dto.availableFrom)
          : null;
        data.availableUntil = dto.availableUntil
          ? new Date(dto.availableUntil)
          : null;
        data.singleAttempt = dto.singleAttempt ?? null;
        data.shuffle = dto.shuffle ?? null;
        data.revealAnswers = dto.revealAnswers ?? null;
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

  // Notifica el examen de recuperación SOLO a los estudiantes elegibles
  // (reprobados; en segunda instancia, los que reprobaron el recuperatorio).
  private async notifyRecoveryPublished(
    moduleId: string,
    contentId: string,
    activityTitle: string,
    stage: RecoveryStage,
  ) {
    const [module, eligible] = await Promise.all([
      this.prisma.courseModule.findUnique({
        where: { id: moduleId },
        select: {
          name: true,
          courseId: true,
          course: { select: { passingScore: true } },
        },
      }),
      this.grading.recoveryEligibleStudents(moduleId, stage),
    ]);
    if (!module || eligible.length === 0) return;
    const label =
      stage === RecoveryStage.SEGUNDA_INSTANCIA
        ? 'segunda instancia'
        : 'recuperatorio';
    await this.notifications.createMany(
      eligible.map((studentId) => ({
        userId: studentId,
        type: NotificationType.ACTIVITY_PUBLISHED,
        title: `Examen de ${label} habilitado`,
        body: `Se habilitó el examen de ${label} «${activityTitle}» del módulo «${module.name}». Si lo rindes, tu nota final será la mayor entre tu nota actual y la del examen (máximo ${Number(module.course.passingScore)}).`,
        data: { courseId: module.courseId, moduleId, activityId: contentId },
      })),
    );
  }

  // Acciones reservadas al ADMIN (p. ej. la segunda instancia).
  private async ensureAdmin(userId: string, message: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== Role.ADMIN) {
      throw new ForbiddenException(message);
    }
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
