import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityType,
  ContentKind,
  ModuleStatus,
  NotificationType,
  Prisma,
  QuestionType,
  QuizAttemptStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GradingService } from '../grading/grading.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AutosaveQuizDto,
  GradeEssaysDto,
  SaveQuestionsDto,
  SubmitQuizDto,
} from './dto/quiz.dto';

const MODULE_FINISHED_MSG =
  'El módulo está concluido; no se pueden realizar cambios.';

// Gracia sobre la fecha límite del intento: absorbe la latencia del auto-envío
// del cliente al expirar el cronómetro. Pasada la gracia, el servidor cierra
// el intento con 0 (el cronómetro del cliente no es autoridad).
const SUBMIT_GRACE_MS = 60_000;

interface Viewer {
  id: string;
  role: Role;
}

/** Normaliza texto para comparar respuestas cortas (sin acentos, minúsculas). */
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Hash estable string→entero (para barajar de forma reproducible por intento). */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function shuffleStable<T extends { id: string }>(
  items: T[],
  seed: string,
): T[] {
  return [...items].sort((a, b) => hash(seed + a.id) - hash(seed + b.id));
}

@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly grading: GradingService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── Autorización ────────────────────────────────────────────────────────────

  /** Carga una actividad QUIZ/EXAM. 404 si no es del motor de preguntas. */
  private async loadQuiz(contentId: string) {
    const content = await this.prisma.moduleContent.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        kind: true,
        activityType: true,
        title: true,
        instructions: true,
        isPublished: true,
        maxScore: true,
        moduleId: true,
        timeLimitMin: true,
        availableFrom: true,
        availableUntil: true,
        singleAttempt: true,
        shuffle: true,
        revealAnswers: true,
        recoveryStage: true,
        module: {
          select: {
            status: true,
            courseId: true,
            course: { select: { status: true } },
          },
        },
      },
    });
    if (
      !content ||
      content.kind !== ContentKind.ACTIVITY ||
      (content.activityType !== ActivityType.QUIZ &&
        content.activityType !== ActivityType.EXAM)
    ) {
      throw new NotFoundException('Cuestionario no encontrado');
    }
    return content;
  }

  private async ensureTeacher(viewer: Viewer, moduleId: string) {
    const rel = await this.prisma.moduleTeacher.findUnique({
      where: { moduleId_teacherId: { moduleId, teacherId: viewer.id } },
      select: { id: true },
    });
    if (rel || viewer.role === Role.ADMIN) return;
    throw new NotFoundException('Cuestionario no encontrado');
  }

  private async ensureStudent(
    viewer: Viewer,
    content: Awaited<ReturnType<QuizService['loadQuiz']>>,
  ) {
    const enrolled = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: viewer.id,
          courseId: content.module.courseId,
        },
      },
      select: { id: true },
    });
    if (
      !enrolled ||
      content.module.course.status === 'DRAFT' ||
      content.module.status === ModuleStatus.DRAFT ||
      !content.isPublished
    ) {
      throw new NotFoundException('Cuestionario no encontrado');
    }
  }

  // ── Docente: constructor de preguntas ───────────────────────────────────────

  async getEditor(viewer: Viewer, contentId: string) {
    const content = await this.loadQuiz(contentId);
    await this.ensureTeacher(viewer, content.moduleId);
    const [questions, attemptCount] = await Promise.all([
      this.prisma.question.findMany({
        where: { contentId },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          type: true,
          prompt: true,
          points: true,
          boolAnswer: true,
          acceptedAnswers: true,
          options: {
            orderBy: { order: 'asc' },
            select: { id: true, text: true, isCorrect: true },
          },
        },
      }),
      this.prisma.quizAttempt.count({ where: { contentId } }),
    ]);
    return {
      activity: {
        id: content.id,
        title: content.title,
        type: content.activityType,
        maxScore: content.maxScore !== null ? Number(content.maxScore) : 0,
      },
      // Con intentos existentes el banco queda bloqueado (ver saveQuestions).
      attemptCount,
      questions: questions.map((q) => ({
        ...q,
        points: Number(q.points),
      })),
    };
  }

  /** Reemplaza todo el banco de preguntas (deleteMany + recreate). */
  async saveQuestions(
    viewer: Viewer,
    contentId: string,
    dto: SaveQuestionsDto,
  ) {
    const content = await this.loadQuiz(contentId);
    await this.ensureTeacher(viewer, content.moduleId);
    // El banco de un examen de recuperación se arma con el módulo ya concluido.
    if (
      !content.recoveryStage &&
      content.module.status === ModuleStatus.FINISHED
    ) {
      throw new ForbiddenException(MODULE_FINISHED_MSG);
    }
    // Editar el banco borra en cascada las QuizAnswer de los intentos ya
    // rendidos (las notas emitidas quedarían sin respaldo). Bloqueado.
    const attemptCount = await this.prisma.quizAttempt.count({
      where: { contentId },
    });
    if (attemptCount > 0) {
      throw new ConflictException(
        'No se pueden editar las preguntas: ya hay intentos de estudiantes.',
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { contentId } });
      for (let i = 0; i < dto.questions.length; i++) {
        const q = dto.questions[i];
        const isChoice =
          q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE';
        await tx.question.create({
          data: {
            contentId,
            order: i,
            type: q.type,
            prompt: q.prompt.trim(),
            points: new Prisma.Decimal(q.points),
            boolAnswer:
              q.type === 'TRUE_FALSE' ? (q.boolAnswer ?? false) : null,
            acceptedAnswers:
              q.type === 'SHORT_TEXT'
                ? q.acceptedAnswers.map((a) => a.trim())
                : [],
            options: isChoice
              ? {
                  create: q.options.map((o, oi) => ({
                    order: oi,
                    text: o.text.trim(),
                    isCorrect: o.isCorrect,
                  })),
                }
              : undefined,
          },
        });
      }
    });
    return { ok: true, count: dto.questions.length };
  }

  // ── Estudiante: rendir el cuestionario ──────────────────────────────────────

  /** Fecha límite efectiva de un intento: min(inicio + tiempo límite, cierre). */
  private attemptDeadline(
    content: { timeLimitMin: number | null; availableUntil: Date | null },
    startedAt: Date,
  ): Date | null {
    const byLimit =
      content.timeLimitMin != null
        ? new Date(startedAt.getTime() + content.timeLimitMin * 60_000)
        : null;
    const byWindow = content.availableUntil;
    if (byLimit && byWindow) return byLimit < byWindow ? byLimit : byWindow;
    return byLimit ?? byWindow;
  }

  /** Califica una respuesta según el tipo de pregunta (null/null para ensayos). */
  private scoreAnswer(
    q: {
      type: QuestionType;
      points: Prisma.Decimal;
      boolAnswer: boolean | null;
      acceptedAnswers: string[];
      options: { id: string; isCorrect: boolean }[];
    },
    a?: {
      selectedOptionIds?: string[];
      boolValue?: boolean | null;
      textValue?: string | null;
    } | null,
  ): { isCorrect: boolean | null; awarded: number | null } {
    const points = Number(q.points);
    if (q.type === QuestionType.ESSAY) {
      return { isCorrect: null, awarded: null };
    }
    if (
      q.type === QuestionType.SINGLE_CHOICE ||
      q.type === QuestionType.MULTIPLE_CHOICE
    ) {
      const correct = new Set(
        q.options.filter((o) => o.isCorrect).map((o) => o.id),
      );
      const chosen = new Set(
        (a?.selectedOptionIds ?? []).filter((id) =>
          q.options.some((o) => o.id === id),
        ),
      );
      const isCorrect =
        chosen.size === correct.size &&
        [...chosen].every((id) => correct.has(id));
      return { isCorrect, awarded: isCorrect ? points : 0 };
    }
    if (q.type === QuestionType.TRUE_FALSE) {
      const isCorrect = a?.boolValue != null && a.boolValue === q.boolAnswer;
      return { isCorrect, awarded: isCorrect ? points : 0 };
    }
    // SHORT_TEXT
    const given = a?.textValue ? normalize(a.textValue) : '';
    const isCorrect =
      given.length > 0 &&
      q.acceptedAnswers.some((ans) => normalize(ans) === given);
    return { isCorrect, awarded: isCorrect ? points : 0 };
  }

  /**
   * Cierra un intento vencido que nunca se envió calificando lo AUTOGUARDADO
   * (ver `autosave`): las respuestas que el estudiante alcanzó a guardar
   * cuentan; sin nada guardado la nota es 0. Si respondió algún ensayo, el
   * intento queda SUBMITTED para que el docente lo corrija. Con reintentos
   * habilitados el estudiante puede volver a rendir mientras siga abierto.
   */
  private async expireAttempt(
    content: { id: string; moduleId: string; maxScore: Prisma.Decimal | null },
    attemptId: string,
    studentId: string,
  ): Promise<{ status: 'SUBMITTED' | 'GRADED'; score: number | null }> {
    const [questions, saved] = await Promise.all([
      this.prisma.question.findMany({
        where: { contentId: content.id },
        select: {
          id: true,
          type: true,
          points: true,
          boolAnswer: true,
          acceptedAnswers: true,
          options: { select: { id: true, isCorrect: true } },
        },
      }),
      this.prisma.quizAnswer.findMany({
        where: { attemptId },
        select: {
          questionId: true,
          selectedOptionIds: true,
          boolValue: true,
          textValue: true,
        },
      }),
    ]);
    const answerOf = new Map(saved.map((a) => [a.questionId, a]));
    const totalPoints = questions.reduce((s, q) => s + Number(q.points), 0);
    let autoEarned = 0;
    let essayAnswered = false;

    await this.prisma.$transaction(async (tx) => {
      for (const q of questions) {
        const a = answerOf.get(q.id);
        if (q.type === QuestionType.ESSAY) {
          if (a?.textValue?.trim()) essayAnswered = true;
          continue;
        }
        if (!a) continue; // sin respuesta guardada → cuenta 0, sin fila
        const { isCorrect, awarded } = this.scoreAnswer(q, a);
        if (awarded != null) autoEarned += awarded;
        await tx.quizAnswer.update({
          where: {
            attemptId_questionId: { attemptId, questionId: q.id },
          },
          data: {
            isCorrect,
            pointsAwarded: awarded != null ? new Prisma.Decimal(awarded) : null,
          },
        });
      }
    });

    const maxScore = content.maxScore !== null ? Number(content.maxScore) : 0;
    const scaled =
      Math.round(
        (totalPoints > 0 ? (autoEarned / totalPoints) * maxScore : 0) * 100,
      ) / 100;

    // Ensayos respondidos → pendiente de corrección (igual que un envío normal).
    if (essayAnswered) {
      await this.prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          status: QuizAttemptStatus.SUBMITTED,
          submittedAt: new Date(),
          autoScore: new Prisma.Decimal(autoEarned),
          totalScore: null,
        },
      });
      await this.grading.applyQuizResult(
        content.id,
        studentId,
        content.moduleId,
        {
          score: 0,
          graded: false,
        },
      );
      return { status: 'SUBMITTED', score: null };
    }

    await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: QuizAttemptStatus.GRADED,
        submittedAt: new Date(),
        autoScore: new Prisma.Decimal(autoEarned),
        totalScore: new Prisma.Decimal(scaled),
      },
    });
    await this.grading.applyQuizResult(
      content.id,
      studentId,
      content.moduleId,
      {
        score: scaled,
        graded: true,
        graderId: null,
      },
    );
    return { status: 'GRADED', score: scaled };
  }

  async getRunner(viewer: Viewer, contentId: string) {
    const content = await this.loadQuiz(contentId);
    await this.ensureStudent(viewer, content);

    // Examen de recuperación: solo lo ve el estudiante elegible (reprobado; en
    // segunda instancia, quien reprobó el recuperatorio) o quien ya lo rindió.
    let recoveryEligible = false;
    if (content.recoveryStage) {
      const [attempt, eligible] = await Promise.all([
        this.prisma.quizAttempt.findFirst({
          where: { contentId, studentId: viewer.id },
          select: { id: true },
        }),
        this.grading.isRecoveryEligible(
          viewer.id,
          content.moduleId,
          content.recoveryStage,
        ),
      ]);
      recoveryEligible = eligible;
      if (!attempt && !eligible) {
        throw new NotFoundException('Cuestionario no encontrado');
      }
    }

    const now = new Date();
    const open =
      (!content.availableFrom || now >= content.availableFrom) &&
      (!content.availableUntil || now <= content.availableUntil);

    let attempt = await this.prisma.quizAttempt.findFirst({
      where: { contentId, studentId: viewer.id },
      orderBy: { attemptNumber: 'desc' },
      select: {
        id: true,
        status: true,
        startedAt: true,
        autoScore: true,
        totalScore: true,
      },
    });

    // Intento en curso ya vencido (más la gracia) → el servidor lo cierra
    // calificando lo autoguardado, en vez de dejarlo eternamente IN_PROGRESS
    // (el cliente pudo cerrarse sin auto-enviar).
    if (attempt && attempt.status === QuizAttemptStatus.IN_PROGRESS) {
      const deadline = this.attemptDeadline(content, attempt.startedAt);
      if (deadline && now.getTime() > deadline.getTime() + SUBMIT_GRACE_MS) {
        await this.expireAttempt(content, attempt.id, viewer.id);
        attempt = await this.prisma.quizAttempt.findUnique({
          where: { id: attempt.id },
          select: {
            id: true,
            status: true,
            startedAt: true,
            autoScore: true,
            totalScore: true,
          },
        });
      }
    }

    const questionCount = await this.prisma.question.count({
      where: { contentId },
    });

    const settings = {
      timeLimitMin: content.timeLimitMin,
      singleAttempt: content.singleAttempt ?? false,
      shuffle: content.shuffle ?? false,
      revealAnswers: content.revealAnswers ?? false,
      availableFrom: content.availableFrom,
      availableUntil: content.availableUntil,
    };
    const base = {
      activity: {
        id: content.id,
        title: content.title,
        type: content.activityType,
        instructions: content.instructions,
        maxScore: content.maxScore !== null ? Number(content.maxScore) : 0,
        questionCount,
        recoveryStage: content.recoveryStage,
      },
      settings,
      open,
      // "Módulo concluido → solo lectura" NO aplica al examen de recuperación:
      // vive justamente en un módulo concluido y debe poder rendirse.
      moduleFinished:
        content.module.status === ModuleStatus.FINISHED &&
        !content.recoveryStage,
    };

    // Intento en curso → entregar las preguntas para responder (sin correctas)
    // más lo autoguardado (para restaurar el formulario al recargar).
    // La fecha límite considera también el cierre del cuestionario.
    if (attempt && attempt.status === QuizAttemptStatus.IN_PROGRESS) {
      const deadline = this.attemptDeadline(content, attempt.startedAt);
      const savedAnswers = await this.prisma.quizAnswer.findMany({
        where: { attemptId: attempt.id },
        select: {
          questionId: true,
          selectedOptionIds: true,
          boolValue: true,
          textValue: true,
        },
      });
      return {
        ...base,
        attempt: { id: attempt.id, status: attempt.status, deadline },
        savedAnswers,
        questions: await this.questionsForAttempt(
          contentId,
          attempt.id,
          content.shuffle ?? false,
        ),
      };
    }

    // Intento enviado/calificado → estado + (si procede) revisión. Si el
    // cuestionario admite varios intentos y sigue abierto, se puede reintentar
    // (solo tras estar calificado; con ensayos pendientes se espera al docente).
    if (attempt) {
      // En un examen de recuperación el reintento exige seguir elegible (si ya
      // aprobó con él, no hay nada que recuperar); en una actividad normal, que
      // el módulo no esté concluido.
      const canRetry =
        attempt.status === QuizAttemptStatus.GRADED &&
        open &&
        (content.recoveryStage
          ? recoveryEligible
          : content.module.status !== ModuleStatus.FINISHED) &&
        !(content.singleAttempt ?? false) &&
        questionCount > 0;
      return {
        ...base,
        attempt: {
          id: attempt.id,
          status: attempt.status,
          score:
            attempt.totalScore !== null ? Number(attempt.totalScore) : null,
        },
        canStart: canRetry,
        review:
          attempt.status === QuizAttemptStatus.GRADED && settings.revealAnswers
            ? await this.buildReview(contentId, attempt.id)
            : null,
      };
    }

    // Sin intento.
    const canStart =
      open &&
      (content.recoveryStage
        ? recoveryEligible
        : content.module.status !== ModuleStatus.FINISHED) &&
      questionCount > 0;
    return { ...base, attempt: null, canStart };
  }

  /** Preguntas para responder (sin marcar correctas), barajadas si aplica. */
  private async questionsForAttempt(
    contentId: string,
    attemptId: string,
    shuffle: boolean,
  ) {
    const questions = await this.prisma.question.findMany({
      where: { contentId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        type: true,
        prompt: true,
        points: true,
        options: {
          orderBy: { order: 'asc' },
          select: { id: true, text: true },
        },
      },
    });
    const mapped = questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      points: Number(q.points),
      options: shuffle ? shuffleStable(q.options, attemptId) : q.options,
    }));
    return shuffle ? shuffleStable(mapped, attemptId) : mapped;
  }

  async start(viewer: Viewer, contentId: string) {
    const content = await this.loadQuiz(contentId);
    await this.ensureStudent(viewer, content);
    if (content.recoveryStage) {
      // Solo el estudiante elegible puede rendir el examen de recuperación
      // (el módulo concluido no lo bloquea: es su razón de ser).
      const eligible = await this.grading.isRecoveryEligible(
        viewer.id,
        content.moduleId,
        content.recoveryStage,
      );
      if (!eligible) {
        throw new NotFoundException('Cuestionario no encontrado');
      }
    } else if (content.module.status === ModuleStatus.FINISHED) {
      throw new ForbiddenException(MODULE_FINISHED_MSG);
    }
    const now = new Date();
    if (content.availableFrom && now < content.availableFrom) {
      throw new BadRequestException('El cuestionario aún no está disponible');
    }
    if (content.availableUntil && now > content.availableUntil) {
      throw new BadRequestException('El cuestionario ya cerró');
    }

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { contentId, studentId: viewer.id },
      orderBy: { attemptNumber: 'desc' },
      select: { id: true, attemptNumber: true, status: true },
    });
    const inProgress = attempts.find(
      (a) => a.status === QuizAttemptStatus.IN_PROGRESS,
    );
    if (inProgress) return { attemptId: inProgress.id }; // reanudar
    if ((content.singleAttempt ?? false) && attempts.length > 0) {
      throw new BadRequestException('Ya rendiste este cuestionario');
    }
    // Con ensayos pendientes de corrección no se abre otro intento (el nuevo
    // envío pisaría la Submission que el docente está por calificar).
    if (attempts[0]?.status === QuizAttemptStatus.SUBMITTED) {
      throw new BadRequestException(
        'Tu intento anterior está pendiente de corrección',
      );
    }
    try {
      const attempt = await this.prisma.quizAttempt.create({
        data: {
          contentId,
          studentId: viewer.id,
          attemptNumber: (attempts[0]?.attemptNumber ?? 0) + 1,
          status: QuizAttemptStatus.IN_PROGRESS,
        },
        select: { id: true },
      });
      return { attemptId: attempt.id };
    } catch (e) {
      // Carrera (doble clic / doble pestaña): dos "start" chocan con el unique
      // (contentId, studentId, attemptNumber) → reanudar el intento que ganó.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const winner = await this.prisma.quizAttempt.findFirst({
          where: {
            contentId,
            studentId: viewer.id,
            status: QuizAttemptStatus.IN_PROGRESS,
          },
          orderBy: { attemptNumber: 'desc' },
          select: { id: true },
        });
        if (winner) return { attemptId: winner.id };
      }
      throw e;
    }
  }

  async submit(viewer: Viewer, contentId: string, dto: SubmitQuizDto) {
    const content = await this.loadQuiz(contentId);
    await this.ensureStudent(viewer, content);
    if (
      !content.recoveryStage &&
      content.module.status === ModuleStatus.FINISHED
    ) {
      throw new ForbiddenException(MODULE_FINISHED_MSG);
    }
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: {
        contentId,
        studentId: viewer.id,
        status: QuizAttemptStatus.IN_PROGRESS,
      },
      orderBy: { attemptNumber: 'desc' },
      select: { id: true, startedAt: true },
    });
    if (!attempt) {
      throw new BadRequestException('No tienes un intento en curso');
    }

    // El cronómetro se valida en el servidor: pasada la fecha límite efectiva
    // (tiempo límite o cierre del cuestionario) más la gracia del auto-envío,
    // las respuestas tardías no cuentan — el intento se cierra calificando lo
    // autoguardado durante el intento.
    const deadline = this.attemptDeadline(content, attempt.startedAt);
    if (deadline && Date.now() > deadline.getTime() + SUBMIT_GRACE_MS) {
      const closed = await this.expireAttempt(content, attempt.id, viewer.id);
      if (closed.status === 'SUBMITTED') {
        return {
          status: 'SUBMITTED' as const,
          pendingReview: true,
          expired: true,
        };
      }
      return {
        status: 'GRADED' as const,
        score: closed.score ?? 0,
        maxScore: content.maxScore !== null ? Number(content.maxScore) : 0,
        expired: true,
      };
    }

    const questions = await this.prisma.question.findMany({
      where: { contentId },
      select: {
        id: true,
        type: true,
        points: true,
        boolAnswer: true,
        acceptedAnswers: true,
        options: { select: { id: true, isCorrect: true } },
      },
    });
    const answerOf = new Map(dto.answers.map((a) => [a.questionId, a]));

    const totalPoints = questions.reduce((s, q) => s + Number(q.points), 0);
    let autoEarned = 0;
    let hasEssay = false;

    await this.prisma.$transaction(async (tx) => {
      // El envío final reemplaza cualquier autoguardado previo.
      await tx.quizAnswer.deleteMany({ where: { attemptId: attempt.id } });
      for (const q of questions) {
        const a = answerOf.get(q.id);
        if (q.type === QuestionType.ESSAY) hasEssay = true;
        const { isCorrect, awarded } = this.scoreAnswer(q, a);
        if (awarded != null) autoEarned += awarded;

        await tx.quizAnswer.create({
          data: {
            attemptId: attempt.id,
            questionId: q.id,
            selectedOptionIds: a?.selectedOptionIds ?? [],
            boolValue: a?.boolValue ?? null,
            textValue: a?.textValue?.trim() || null,
            isCorrect,
            pointsAwarded: awarded != null ? new Prisma.Decimal(awarded) : null,
          },
        });
      }
    });

    const maxScore = content.maxScore !== null ? Number(content.maxScore) : 0;
    const autoScaled =
      totalPoints > 0 ? (autoEarned / totalPoints) * maxScore : 0;

    if (hasEssay) {
      // Quedan ensayos por corregir → SUBMITTED, sin nota aún.
      await this.prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          status: QuizAttemptStatus.SUBMITTED,
          submittedAt: new Date(),
          autoScore: new Prisma.Decimal(autoEarned),
          totalScore: null,
        },
      });
      await this.grading.applyQuizResult(
        contentId,
        viewer.id,
        content.moduleId,
        { score: 0, graded: false },
      );
      return { status: 'SUBMITTED' as const, pendingReview: true };
    }

    // 100% autocalificable → GRADED.
    const scaled = Math.round(autoScaled * 100) / 100;
    await this.prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        status: QuizAttemptStatus.GRADED,
        submittedAt: new Date(),
        autoScore: new Prisma.Decimal(autoEarned),
        totalScore: new Prisma.Decimal(scaled),
      },
    });
    await this.grading.applyQuizResult(contentId, viewer.id, content.moduleId, {
      score: scaled,
      graded: true,
      graderId: null,
    });
    return { status: 'GRADED' as const, score: scaled, maxScore };
  }

  /**
   * Autoguardado progresivo del intento en curso: persiste las respuestas SIN
   * calificar (isCorrect/pointsAwarded quedan null hasta el envío) para que un
   * intento que venza sin envío se califique con lo guardado (`expireAttempt`)
   * y para restaurar el formulario si el estudiante recarga la página.
   */
  async autosave(viewer: Viewer, contentId: string, dto: AutosaveQuizDto) {
    const content = await this.loadQuiz(contentId);
    await this.ensureStudent(viewer, content);
    if (
      !content.recoveryStage &&
      content.module.status === ModuleStatus.FINISHED
    ) {
      throw new ForbiddenException(MODULE_FINISHED_MSG);
    }
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: {
        contentId,
        studentId: viewer.id,
        status: QuizAttemptStatus.IN_PROGRESS,
      },
      orderBy: { attemptNumber: 'desc' },
      select: { id: true, startedAt: true },
    });
    if (!attempt) {
      throw new BadRequestException('No tienes un intento en curso');
    }
    const deadline = this.attemptDeadline(content, attempt.startedAt);
    if (deadline && Date.now() > deadline.getTime() + SUBMIT_GRACE_MS) {
      throw new BadRequestException('El intento ya venció');
    }

    // Solo respuestas a preguntas reales del cuestionario.
    const known = new Set(
      (
        await this.prisma.question.findMany({
          where: { contentId },
          select: { id: true },
        })
      ).map((q) => q.id),
    );
    const answers = dto.answers.filter((a) => known.has(a.questionId));
    await this.prisma.$transaction(
      answers.map((a) =>
        this.prisma.quizAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId: a.questionId,
            },
          },
          create: {
            attemptId: attempt.id,
            questionId: a.questionId,
            selectedOptionIds: a.selectedOptionIds ?? [],
            boolValue: a.boolValue ?? null,
            textValue: a.textValue?.trim() || null,
          },
          update: {
            selectedOptionIds: a.selectedOptionIds ?? [],
            boolValue: a.boolValue ?? null,
            textValue: a.textValue?.trim() || null,
            isCorrect: null,
            pointsAwarded: null,
          },
        }),
      ),
    );
    return { ok: true, saved: answers.length };
  }

  /** Revisión por pregunta (para el estudiante si revealAnswers, o el docente). */
  private async buildReview(contentId: string, attemptId: string) {
    const [questions, answers] = await Promise.all([
      this.prisma.question.findMany({
        where: { contentId },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          type: true,
          prompt: true,
          points: true,
          boolAnswer: true,
          acceptedAnswers: true,
          options: {
            orderBy: { order: 'asc' },
            select: { id: true, text: true, isCorrect: true },
          },
        },
      }),
      this.prisma.quizAnswer.findMany({
        where: { attemptId },
        select: {
          questionId: true,
          selectedOptionIds: true,
          boolValue: true,
          textValue: true,
          isCorrect: true,
          pointsAwarded: true,
        },
      }),
    ]);
    const ansOf = new Map(answers.map((a) => [a.questionId, a]));
    return questions.map((q) => {
      const a = ansOf.get(q.id);
      return {
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        points: Number(q.points),
        boolAnswer: q.boolAnswer,
        acceptedAnswers: q.acceptedAnswers,
        options: q.options,
        answer: a
          ? {
              selectedOptionIds: a.selectedOptionIds,
              boolValue: a.boolValue,
              textValue: a.textValue,
              isCorrect: a.isCorrect,
              pointsAwarded:
                a.pointsAwarded !== null ? Number(a.pointsAwarded) : null,
            }
          : null,
      };
    });
  }

  // ── Docente: intentos + corrección de ensayos ───────────────────────────────

  async getAttempts(viewer: Viewer, contentId: string) {
    const content = await this.loadQuiz(contentId);
    await this.ensureTeacher(viewer, content.moduleId);

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { contentId },
      orderBy: [{ student: { lastName: 'asc' } }, { attemptNumber: 'desc' }],
      select: {
        id: true,
        status: true,
        submittedAt: true,
        autoScore: true,
        totalScore: true,
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    // Solo el último intento por estudiante.
    const latest = new Map<string, (typeof attempts)[number]>();
    for (const a of attempts) {
      if (!latest.has(a.student.id)) latest.set(a.student.id, a);
    }
    return {
      activity: {
        id: content.id,
        title: content.title,
        type: content.activityType,
        maxScore: content.maxScore !== null ? Number(content.maxScore) : 0,
      },
      attempts: [...latest.values()].map((a) => ({
        attemptId: a.id,
        student: a.student,
        status: a.status,
        submittedAt: a.submittedAt,
        autoScore: a.autoScore !== null ? Number(a.autoScore) : null,
        totalScore: a.totalScore !== null ? Number(a.totalScore) : null,
      })),
    };
  }

  /** Detalle de un intento para corregir (preguntas + respuestas). */
  async getAttemptDetail(viewer: Viewer, attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      select: { contentId: true },
    });
    if (!attempt) throw new NotFoundException('Intento no encontrado');
    const content = await this.loadQuiz(attempt.contentId);
    await this.ensureTeacher(viewer, content.moduleId);
    return {
      activity: { id: content.id, title: content.title },
      review: await this.buildReview(attempt.contentId, attemptId),
    };
  }

  /** El docente puntúa los ensayos → recombina la nota y cierra el intento. */
  async gradeEssays(viewer: Viewer, attemptId: string, dto: GradeEssaysDto) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, contentId: true, studentId: true, status: true },
    });
    if (!attempt) throw new NotFoundException('Intento no encontrado');
    // Un intento en curso no tiene respuestas todavía: calificarlo lo cerraría
    // con 0 mientras el estudiante sigue resolviendo.
    if (attempt.status === QuizAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'El intento aún está en curso; no se puede calificar',
      );
    }
    const content = await this.loadQuiz(attempt.contentId);
    await this.ensureTeacher(viewer, content.moduleId);
    // Los ensayos de un examen de recuperación se corrigen con el módulo
    // concluido (es su estado natural).
    if (
      !content.recoveryStage &&
      content.module.status === ModuleStatus.FINISHED
    ) {
      throw new ForbiddenException(MODULE_FINISHED_MSG);
    }

    const questions = await this.prisma.question.findMany({
      where: { contentId: attempt.contentId },
      select: { id: true, type: true, points: true },
    });
    const essayPoints = new Map(
      questions
        .filter((q) => q.type === QuestionType.ESSAY)
        .map((q) => [q.id, Number(q.points)]),
    );
    const gradeOf = new Map(dto.grades.map((g) => [g.questionId, g.points]));

    // Aplica los puntos de cada ensayo (acotados a su puntaje máximo).
    await this.prisma.$transaction(async (tx) => {
      for (const [qid, maxPts] of essayPoints) {
        if (!gradeOf.has(qid)) continue;
        const pts = Math.min(Math.max(gradeOf.get(qid)!, 0), maxPts);
        await tx.quizAnswer.updateMany({
          where: { attemptId, questionId: qid },
          data: {
            pointsAwarded: new Prisma.Decimal(pts),
            isCorrect: pts >= maxPts,
          },
        });
      }
    });

    // Recalcula la nota total con auto + ensayos.
    const answers = await this.prisma.quizAnswer.findMany({
      where: { attemptId },
      select: { pointsAwarded: true },
    });
    const earned = answers.reduce(
      (s, a) => s + (a.pointsAwarded !== null ? Number(a.pointsAwarded) : 0),
      0,
    );
    const totalPoints = questions.reduce((s, q) => s + Number(q.points), 0);
    const maxScore = content.maxScore !== null ? Number(content.maxScore) : 0;
    const scaled =
      Math.round(
        (totalPoints > 0 ? (earned / totalPoints) * maxScore : 0) * 100,
      ) / 100;

    await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: QuizAttemptStatus.GRADED,
        totalScore: new Prisma.Decimal(scaled),
        manualScore: new Prisma.Decimal(
          [...essayPoints.keys()].reduce(
            (s, qid) =>
              s +
              Math.min(
                Math.max(gradeOf.get(qid) ?? 0, 0),
                essayPoints.get(qid)!,
              ),
            0,
          ),
        ),
      },
    });
    await this.grading.applyQuizResult(
      attempt.contentId,
      attempt.studentId,
      content.moduleId,
      { score: scaled, graded: true, graderId: viewer.id },
    );
    await this.notifications.createMany([
      {
        userId: attempt.studentId,
        type: NotificationType.GRADE,
        title: 'Cuestionario calificado',
        body: `Tu ${content.activityType === ActivityType.EXAM ? 'examen' : 'cuestionario'} «${content.title}» recibió una nota de ${scaled}/${maxScore}.`,
        data: { moduleId: content.moduleId, activityId: attempt.contentId },
      },
    ]);
    return { ok: true, score: scaled };
  }
}
