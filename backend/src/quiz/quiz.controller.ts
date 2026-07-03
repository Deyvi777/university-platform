import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  AutosaveQuizDto,
  GradeEssaysDto,
  SaveQuestionsDto,
  SubmitQuizDto,
} from './dto/quiz.dto';
import { QuizService } from './quiz.service';

// Motor de Cuestionario/Examen (activityType = QUIZ/EXAM). Solo requiere
// autenticación: el servicio autoriza por docencia o inscripción.
@ApiTags('quiz')
@ApiBearerAuth()
@Controller('me/quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly quiz: QuizService) {}

  // ── Docente: corrección de intentos (rutas estáticas primero) ──────────────

  @Get('attempts/:attemptId')
  getAttemptDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId') attemptId: string,
  ) {
    return this.quiz.getAttemptDetail(
      { id: user.id, role: user.role },
      attemptId,
    );
  }

  @Put('attempts/:attemptId/grade-essays')
  gradeEssays(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId') attemptId: string,
    @Body() dto: GradeEssaysDto,
  ) {
    return this.quiz.gradeEssays(
      { id: user.id, role: user.role },
      attemptId,
      dto,
    );
  }

  // ── Docente: constructor + lista de intentos ───────────────────────────────

  @Get(':activityId/editor')
  getEditor(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId') activityId: string,
  ) {
    return this.quiz.getEditor({ id: user.id, role: user.role }, activityId);
  }

  @Put(':activityId/questions')
  saveQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId') activityId: string,
    @Body() dto: SaveQuestionsDto,
  ) {
    return this.quiz.saveQuestions(
      { id: user.id, role: user.role },
      activityId,
      dto,
    );
  }

  @Get(':activityId/attempts')
  getAttempts(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId') activityId: string,
  ) {
    return this.quiz.getAttempts({ id: user.id, role: user.role }, activityId);
  }

  // ── Estudiante: rendir ─────────────────────────────────────────────────────

  @Get(':activityId')
  getRunner(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId') activityId: string,
  ) {
    return this.quiz.getRunner({ id: user.id, role: user.role }, activityId);
  }

  @Post(':activityId/start')
  start(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId') activityId: string,
  ) {
    return this.quiz.start({ id: user.id, role: user.role }, activityId);
  }

  @Post(':activityId/submit')
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId') activityId: string,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.quiz.submit({ id: user.id, role: user.role }, activityId, dto);
  }

  // Autoguardado progresivo del intento en curso (sin calificar).
  @Put(':activityId/answers')
  autosave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId') activityId: string,
    @Body() dto: AutosaveQuizDto,
  ) {
    return this.quiz.autosave(
      { id: user.id, role: user.role },
      activityId,
      dto,
    );
  }
}
