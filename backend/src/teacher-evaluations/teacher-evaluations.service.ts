import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ModuleStatus,
  Prisma,
  TeacherEvaluationQuestionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  SetTeacherEvaluationEnabledDto,
  SubmitTeacherEvaluationDto,
  UpdateTeacherEvaluationQuestionnaireDto,
} from './dto/teacher-evaluation.dto';

const personSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

@Injectable()
export class TeacherEvaluationsService {
  constructor(private readonly prisma: PrismaService) {}

  getQuestionnaire() {
    return this.prisma.teacherEvaluationQuestion.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async updateQuestionnaire(dto: UpdateTeacherEvaluationQuestionnaireDto) {
    const current = await this.prisma.teacherEvaluationQuestion.findMany({
      select: { id: true, order: true },
    });
    const currentIds = new Set(current.map((question) => question.id));
    const incomingIds = dto.questions.flatMap((question) =>
      question.id ? [question.id] : [],
    );
    if (
      new Set(incomingIds).size !== incomingIds.length ||
      incomingIds.some((id) => !currentIds.has(id))
    ) {
      throw new BadRequestException(
        'El cuestionario contiene una pregunta inválida',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Libera el índice único de orden antes de reordenar.
      const temporaryStart =
        current.reduce(
          (minimum, question) => Math.min(minimum, question.order),
          0,
        ) -
        current.length -
        1;
      for (const [index, question] of current.entries()) {
        await tx.teacherEvaluationQuestion.update({
          where: { id: question.id },
          data: { order: temporaryStart - index },
        });
      }

      for (const [index, question] of dto.questions.entries()) {
        const data = {
          type: question.type,
          prompt: question.prompt,
          required: question.required,
          options: question.options,
          order: index + 1,
          isActive: true,
        };
        if (question.id) {
          await tx.teacherEvaluationQuestion.update({
            where: { id: question.id },
            data,
          });
        } else {
          await tx.teacherEvaluationQuestion.create({ data });
        }
      }

      const retained = new Set(incomingIds);
      const removed = current.filter((question) => !retained.has(question.id));
      for (const [index, question] of removed.entries()) {
        await tx.teacherEvaluationQuestion.update({
          where: { id: question.id },
          data: {
            isActive: false,
            order: temporaryStart - current.length - index - 1,
          },
        });
      }
    });

    return this.getQuestionnaire();
  }

  listResults() {
    return this.prisma.teacherEvaluation.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        module: {
          select: {
            id: true,
            order: true,
            name: true,
            course: { select: { id: true, code: true, name: true } },
          },
        },
        teacher: { select: personSelect },
        student: { select: personSelect },
        answers: {
          orderBy: { questionOrderSnapshot: 'asc' },
          select: {
            id: true,
            questionPromptSnapshot: true,
            questionTypeSnapshot: true,
            questionOrderSnapshot: true,
            scaleValue: true,
            selectedOptions: true,
            textValue: true,
          },
        },
      },
    });
  }

  async setModuleEnabled(
    courseId: string,
    moduleId: string,
    dto: SetTeacherEvaluationEnabledDto,
  ) {
    const module = await this.prisma.courseModule.findFirst({
      where: { id: moduleId, courseId },
      select: { id: true },
    });
    if (!module) {
      throw new NotFoundException('Módulo no encontrado en este programa');
    }
    await this.prisma.courseModule.update({
      where: { id: moduleId },
      data: { teacherEvaluationEnabled: dto.enabled },
    });
    return { enabled: dto.enabled };
  }

  async getForStudent(studentId: string, moduleId: string) {
    const module = await this.findAvailableModule(studentId, moduleId);
    const questions = await this.getQuestionnaire();
    const submitted = await this.prisma.teacherEvaluation.findMany({
      where: { moduleId, studentId },
      select: { teacherId: true, createdAt: true },
    });
    const byTeacher = new Map(
      submitted.map((evaluation) => [
        evaluation.teacherId,
        evaluation.createdAt,
      ]),
    );
    return {
      module: {
        id: module.id,
        order: module.order,
        name: module.name,
        course: module.course,
      },
      enabled:
        module.status === ModuleStatus.FINISHED &&
        module.teacherEvaluationEnabled,
      questions,
      teachers: module.teachers.map(({ teacher }) => ({
        ...teacher,
        submittedAt: byTeacher.get(teacher.id) ?? null,
      })),
    };
  }

  async submit(
    studentId: string,
    moduleId: string,
    dto: SubmitTeacherEvaluationDto,
  ) {
    const module = await this.findAvailableModule(studentId, moduleId);
    if (
      module.status !== ModuleStatus.FINISHED ||
      !module.teacherEvaluationEnabled
    ) {
      throw new ForbiddenException(
        'La evaluación docente no está disponible para este módulo',
      );
    }
    if (!module.teachers.some(({ teacher }) => teacher.id === dto.teacherId)) {
      throw new BadRequestException(
        'El docente no está asignado a este módulo',
      );
    }

    const questions = await this.getQuestionnaire();
    if (questions.length === 0) {
      throw new ConflictException(
        'El cuestionario de evaluación aún no está configurado',
      );
    }
    const byQuestion = new Map(
      dto.answers.map((answer) => [answer.questionId, answer]),
    );
    if (byQuestion.size !== dto.answers.length) {
      throw new BadRequestException('Hay respuestas duplicadas');
    }
    for (const question of questions) {
      const answer = byQuestion.get(question.id);
      this.validateAnswer(question, answer);
    }
    if (
      dto.answers.some(
        (answer) => !questions.some((q) => q.id === answer.questionId),
      )
    ) {
      throw new BadRequestException(
        'El cuestionario contiene una respuesta inválida',
      );
    }

    const existing = await this.prisma.teacherEvaluation.findUnique({
      where: {
        moduleId_teacherId_studentId: {
          moduleId,
          teacherId: dto.teacherId,
          studentId,
        },
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Ya evaluaste a este docente en el módulo');
    }

    try {
      return await this.prisma.teacherEvaluation.create({
        data: {
          moduleId,
          teacherId: dto.teacherId,
          studentId,
          answers: {
            create: questions.map((question) => {
              const answer = byQuestion.get(question.id) ?? {
                selectedOptions: [],
                scaleValue: null,
                textValue: null,
              };
              return {
                questionId: question.id,
                questionPromptSnapshot: question.prompt,
                questionTypeSnapshot: question.type,
                questionOrderSnapshot: question.order,
                scaleValue: answer.scaleValue ?? null,
                selectedOptions: answer.selectedOptions,
                textValue: answer.textValue || null,
              };
            }),
          },
        },
        select: { id: true, createdAt: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya evaluaste a este docente en el módulo');
      }
      throw error;
    }
  }

  private async findAvailableModule(studentId: string, moduleId: string) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: {
        id: true,
        order: true,
        name: true,
        status: true,
        teacherEvaluationEnabled: true,
        course: { select: { id: true, code: true, name: true } },
        teachers: {
          orderBy: { assignedAt: 'asc' },
          select: { teacher: { select: personSelect } },
        },
      },
    });
    if (!module) throw new NotFoundException('Módulo no encontrado');
    const enrolled = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: module.course.id } },
      select: { id: true },
    });
    if (!enrolled) throw new NotFoundException('Módulo no encontrado');
    return module;
  }

  private validateAnswer(
    question: {
      type: TeacherEvaluationQuestionType;
      prompt: string;
      required: boolean;
      options: string[];
    },
    answer:
      | {
          scaleValue?: number | null;
          selectedOptions: string[];
          textValue?: string | null;
        }
      | undefined,
  ) {
    const hasText = Boolean(answer?.textValue?.trim());
    const hasScale = answer?.scaleValue != null;
    const hasSelection = Boolean(answer?.selectedOptions.length);
    if (question.required && !hasText && !hasScale && !hasSelection) {
      throw new BadRequestException(
        `La pregunta «${question.prompt}» es obligatoria`,
      );
    }
    if (!answer) return;
    if (question.type === 'SCALE_1_5' && (hasText || hasSelection)) {
      throw new BadRequestException('Respuesta de escala inválida');
    }
    if (question.type === 'TEXT' && (hasScale || hasSelection)) {
      throw new BadRequestException('Respuesta de texto inválida');
    }
    if (
      (question.type === 'SINGLE_CHOICE' ||
        question.type === 'MULTIPLE_CHOICE') &&
      (hasScale ||
        hasText ||
        answer.selectedOptions.some(
          (option) => !question.options.includes(option),
        ) ||
        (question.type === 'SINGLE_CHOICE' &&
          answer.selectedOptions.length > 1))
    ) {
      throw new BadRequestException('Respuesta de selección inválida');
    }
  }
}
