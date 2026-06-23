import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { ModuleContentService } from './module-content.service';
import {
  ContentNoteDto,
  ContentProgressDto,
  CreateContentDto,
  ReorderContentsDto,
  UpdateContentDto,
} from './dto/module-content.dto';

// Gestión del contenido de un módulo por el docente que lo dicta + vista de
// aprendizaje del estudiante inscrito. Solo requiere autenticación: el servicio
// autoriza por docencia (docente) o inscripción (estudiante).
@ApiTags('module-content')
@ApiBearerAuth()
@Controller('me')
@UseGuards(JwtAuthGuard)
export class ModuleContentController {
  constructor(private readonly content: ModuleContentService) {}

  // ── Docente: gestión del módulo y sus contenidos ──
  @Get('modules/:moduleId')
  getModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
  ) {
    return this.content.getModule(user.id, moduleId);
  }

  @Post('modules/:moduleId/contents')
  createContent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateContentDto,
  ) {
    return this.content.createContent(user.id, moduleId, dto);
  }

  @Put('modules/:moduleId/contents/reorder')
  reorderContents(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
    @Body() dto: ReorderContentsDto,
  ) {
    return this.content.reorderContents(user.id, moduleId, dto);
  }

  @Patch('contents/:contentId')
  updateContent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.content.updateContent(user.id, contentId, dto);
  }

  @Delete('contents/:contentId')
  removeContent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
  ) {
    return this.content.removeContent(user.id, contentId);
  }

  // ── Estudiante: vista de aprendizaje + progreso/notas ──
  @Get('modules/:moduleId/learn')
  learnModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
  ) {
    return this.content.getModuleForStudent(user.id, moduleId);
  }

  @Put('contents/:contentId/progress')
  setContentProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
    @Body() dto: ContentProgressDto,
  ) {
    return this.content.setContentProgress(user.id, contentId, dto.completed);
  }

  @Put('contents/:contentId/note')
  setContentNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
    @Body() dto: ContentNoteDto,
  ) {
    return this.content.setContentNote(user.id, contentId, dto.body);
  }
}
