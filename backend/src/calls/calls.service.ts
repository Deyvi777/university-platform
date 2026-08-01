import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CallQuestionType, Prisma } from '@prisma/client';
import { slugify } from '../common/utils/slugify';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  CreateCallApplicationDto,
  CreateCallDto,
  UpdateCallDto,
} from './dto/call.dto';

const publicQuestionSelect = {
  id: true,
  order: true,
  type: true,
  prompt: true,
  description: true,
  required: true,
  options: true,
} as const;

/** Debe coincidir con el default de SiteSettings.callApplicationNotifyEmail. */
const DEFAULT_CALL_NOTIFY_EMAIL = 'certificatebolivia@gmail.com';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly mail: MailService,
  ) {}

  findAllPublic() {
    return this.prisma.call.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        coverUrl: true,
        opensAt: true,
        closesAt: true,
        _count: {
          select: { questions: { where: { isActive: true } } },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findPublicBySlug(slug: string) {
    const call = await this.prisma.call.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        description: true,
        coverUrl: true,
        opensAt: true,
        closesAt: true,
        questions: {
          where: { isActive: true },
          select: publicQuestionSelect,
          orderBy: { order: 'asc' },
        },
        isPublished: true,
      },
    });
    if (!call?.isPublished) {
      throw new NotFoundException('Convocatoria no encontrada');
    }
    return { ...call, isOpen: this.isOpen(call.opensAt, call.closesAt) };
  }

  findAllAdmin() {
    return this.prisma.call.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        opensAt: true,
        closesAt: true,
        isPublished: true,
        displayOrder: true,
        updatedAt: true,
        _count: {
          select: {
            questions: { where: { isActive: true } },
            applications: true,
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOneAdmin(id: string) {
    const call = await this.prisma.call.findUnique({
      where: { id },
      include: {
        questions: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: { select: { applications: true } },
      },
    });
    if (!call) throw new NotFoundException('Convocatoria no encontrada');
    return call;
  }

  async create(dto: CreateCallDto) {
    const slug = await this.buildUniqueSlug(dto.slug ?? slugify(dto.title));
    const last = await this.prisma.call.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    const { questions, opensAt, closesAt, ...data } = dto;
    return this.prisma.call.create({
      data: {
        ...data,
        slug,
        displayOrder: (last?.displayOrder ?? 0) + 1,
        opensAt: opensAt ? new Date(opensAt) : null,
        closesAt: closesAt ? new Date(closesAt) : null,
        questions: {
          create: questions.map((question, index) => ({
            type: question.type,
            prompt: question.prompt,
            description: question.description ?? null,
            required: question.required,
            options: question.options,
            order: index + 1,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  async update(id: string, dto: UpdateCallDto) {
    const existing = await this.findOneAdmin(id);
    const { questions, slug, opensAt, closesAt, ...rest } = dto;
    const data: Prisma.CallUpdateInput = { ...rest };
    if (slug !== undefined) data.slug = await this.buildUniqueSlug(slug, id);
    if (opensAt !== undefined)
      data.opensAt = opensAt ? new Date(opensAt) : null;
    if (closesAt !== undefined)
      data.closesAt = closesAt ? new Date(closesAt) : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.call.update({ where: { id }, data });
      if (questions) {
        const current = await tx.callQuestion.findMany({
          where: { callId: id },
          select: {
            id: true,
            prompt: true,
            type: true,
            order: true,
            _count: { select: { answers: true } },
          },
        });
        const currentIds = new Set(current.map((question) => question.id));
        const incomingIds = questions.flatMap((question) =>
          question.id ? [question.id] : [],
        );
        if (
          new Set(incomingIds).size !== incomingIds.length ||
          incomingIds.some((questionId) => !currentIds.has(questionId))
        ) {
          throw new BadRequestException(
            'El formulario contiene una pregunta inválida',
          );
        }

        // Las respuestas creadas antes de introducir snapshots se completan
        // con el estado actual justo antes de cualquier modificación.
        for (const question of current) {
          if (question._count.answers === 0) continue;
          await tx.callApplicationAnswer.updateMany({
            where: {
              questionId: question.id,
              questionPromptSnapshot: null,
            },
            data: {
              questionPromptSnapshot: question.prompt,
              questionTypeSnapshot: question.type,
              questionOrderSnapshot: question.order,
            },
          });
        }

        // Libera temporalmente los números de orden para que intercambiar dos
        // preguntas no choque con @@unique([callId, order]). El rango se mueve
        // por debajo del menor orden actual, así también funciona después de
        // varias ediciones con preguntas retiradas.
        const temporaryStart =
          current.reduce(
            (minimum, question) => Math.min(minimum, question.order),
            0,
          ) -
          current.length -
          1;
        for (const [index, question] of current.entries()) {
          await tx.callQuestion.update({
            where: { id: question.id },
            data: { order: temporaryStart - index },
          });
        }

        for (const [index, question] of questions.entries()) {
          const questionData = {
            type: question.type,
            prompt: question.prompt,
            description: question.description ?? null,
            required: question.required,
            options: question.options,
            order: index + 1,
            isActive: true,
          };
          if (question.id) {
            await tx.callQuestion.update({
              where: { id: question.id },
              data: questionData,
            });
          } else {
            await tx.callQuestion.create({
              data: { ...questionData, callId: id },
            });
          }
        }

        const keptIds = new Set(incomingIds);
        for (const question of current) {
          if (keptIds.has(question.id)) continue;
          await tx.callQuestion.update({
            where: { id: question.id },
            data: { isActive: false },
          });
        }
      }
    });

    if (dto.coverUrl && dto.coverUrl !== existing.coverUrl) {
      await this.storage.deleteByUrls([existing.coverUrl]);
    }
    return this.findOneAdmin(id);
  }

  async remove(id: string) {
    const existing = await this.findOneAdmin(id);
    if (existing._count.applications > 0) {
      throw new ConflictException(
        'No se puede eliminar una convocatoria que tiene postulaciones',
      );
    }
    await this.prisma.call.delete({ where: { id } });
    await this.storage.deleteByUrls([existing.coverUrl]);
    return { success: true };
  }

  async createApplication(slug: string, dto: CreateCallApplicationDto) {
    const call = await this.prisma.call.findUnique({
      where: { slug },
      include: {
        questions: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!call?.isPublished) {
      throw new NotFoundException('Convocatoria no encontrada');
    }
    if (!this.isOpen(call.opensAt, call.closesAt)) {
      throw new ConflictException(
        'La convocatoria no está recibiendo postulaciones',
      );
    }

    const incoming = new Map(
      dto.answers.map((answer) => [answer.questionId, answer]),
    );
    const unknown = dto.answers.find(
      (answer) =>
        !call.questions.some((question) => question.id === answer.questionId),
    );
    if (unknown)
      throw new BadRequestException(
        'La postulación contiene una pregunta inválida',
      );

    const answers = call.questions.flatMap((question) => {
      const answer = incoming.get(question.id);
      this.validateAnswer(question, answer);
      if (!answer) return [];
      return [
        {
          questionId: question.id,
          questionPromptSnapshot: question.prompt,
          questionTypeSnapshot: question.type,
          questionOrderSnapshot: question.order,
          textValue: answer.textValue?.trim() || null,
          selectedOptions: answer.selectedOptions,
          files: answer.files,
        },
      ];
    });

    const application = await this.prisma.callApplication.create({
      data: {
        callId: call.id,
        answers: { create: answers },
      },
      select: { id: true, submittedAt: true },
    });
    await this.emailApplicationNotice({
      callId: call.id,
      callTitle: call.title,
      applicationId: application.id,
      submittedAt: application.submittedAt,
      answers: answers.map((answer) => ({
        prompt: answer.questionPromptSnapshot,
        textValue: answer.textValue,
        selectedOptions: answer.selectedOptions,
        files: answer.files,
      })),
    });
    return { success: true, ...application };
  }

  async listApplications(callId: string) {
    await this.findOneAdmin(callId);
    const applications = await this.prisma.callApplication.findMany({
      where: { callId },
      include: {
        answers: {
          include: {
            question: { select: publicQuestionSelect },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
    return applications.map((application) => ({
      ...application,
      answers: application.answers
        .slice()
        .sort(
          (left, right) =>
            (left.questionOrderSnapshot ?? left.question.order) -
            (right.questionOrderSnapshot ?? right.question.order),
        ),
    }));
  }

  async removeApplication(callId: string, applicationId: string) {
    const application = await this.prisma.callApplication.findFirst({
      where: { id: applicationId, callId },
      select: {
        answers: { select: { files: true } },
      },
    });
    if (!application) {
      throw new NotFoundException('Postulación no encontrada');
    }

    const fileUrls = application.answers.flatMap(({ files }) => {
      if (!Array.isArray(files)) return [];
      return files.flatMap((file) => {
        if (!file || typeof file !== 'object' || Array.isArray(file)) return [];
        const url = file.url;
        return typeof url === 'string' ? [url] : [];
      });
    });

    await this.prisma.callApplication.delete({
      where: { id: applicationId },
    });
    await this.storage.deleteByUrls(fileUrls);
    return { success: true };
  }

  private validateAnswer(
    question: {
      type: CallQuestionType;
      required: boolean;
      options: string[];
      prompt: string;
    },
    answer: CreateCallApplicationDto['answers'][number] | undefined,
  ) {
    const text = answer?.textValue?.trim() ?? '';
    const selected = answer?.selectedOptions ?? [];
    const files = answer?.files ?? [];
    const hasValue = text !== '' || selected.length > 0 || files.length > 0;
    if (question.required && !hasValue) {
      throw new BadRequestException(`Debes responder: ${question.prompt}`);
    }
    if (!hasValue) return;
    if (
      question.type === CallQuestionType.TEXT &&
      (selected.length || files.length)
    ) {
      throw new BadRequestException(
        `Respuesta inválida para: ${question.prompt}`,
      );
    }
    if (
      question.type === CallQuestionType.FILE &&
      (!files.length || text || selected.length)
    ) {
      throw new BadRequestException(
        `Archivo inválido para: ${question.prompt}`,
      );
    }
    if (
      question.type === CallQuestionType.SINGLE_CHOICE &&
      selected.length !== 1
    ) {
      throw new BadRequestException(
        `Selecciona una opción en: ${question.prompt}`,
      );
    }
    if (
      question.type === CallQuestionType.MULTIPLE_CHOICE &&
      selected.length < 1
    ) {
      throw new BadRequestException(
        `Selecciona al menos una opción en: ${question.prompt}`,
      );
    }
    if (
      (question.type === CallQuestionType.SINGLE_CHOICE ||
        question.type === CallQuestionType.MULTIPLE_CHOICE) &&
      selected.some((option) => !question.options.includes(option))
    ) {
      throw new BadRequestException(`Opción inválida en: ${question.prompt}`);
    }
  }

  private isOpen(opensAt: Date | null, closesAt: Date | null) {
    const now = new Date();
    return (!opensAt || opensAt <= now) && (!closesAt || closesAt >= now);
  }

  /** Encola el aviso sin comprometer la postulación si correo/Redis falla. */
  private async emailApplicationNotice(application: {
    callId: string;
    callTitle: string;
    applicationId: string;
    submittedAt: Date;
    answers: Array<{
      prompt: string;
      textValue: string | null;
      selectedOptions: string[];
      files: Array<{
        name: string;
        url: string;
        size: number;
        mimeType: string;
      }>;
    }>;
  }) {
    try {
      const settings = await this.prisma.siteSettings.findUnique({
        where: { id: 'singleton' },
        select: { callApplicationNotifyEmail: true },
      });
      await this.mail.enqueueCallApplicationNotice({
        to: settings?.callApplicationNotifyEmail ?? DEFAULT_CALL_NOTIFY_EMAIL,
        callId: application.callId,
        callTitle: application.callTitle,
        applicationId: application.applicationId,
        submittedAt: application.submittedAt.toISOString(),
        answers: application.answers,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo encolar el aviso de la postulación ${application.applicationId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async buildUniqueSlug(base: string, excludeId?: string) {
    const root = slugify(base);
    if (!root) throw new ConflictException('No se pudo generar un slug válido');
    let candidate = root;
    let suffix = 2;
    while (true) {
      const existing = await this.prisma.call.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing || existing.id === excludeId) return candidate;
      candidate = `${root}-${suffix++}`;
    }
  }
}
