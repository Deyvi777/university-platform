import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateForumPostDto, UpdateForumPostDto } from './dto/forum.dto';
import { ForumService } from './forum.service';

// Foro de discusión público de una actividad (activityType = FORUM). Solo
// requiere autenticación: el servicio autoriza por docencia o inscripción.
@ApiTags('forum')
@ApiBearerAuth()
@Controller('me/forum')
@UseGuards(JwtAuthGuard)
export class ForumController {
  constructor(private readonly forum: ForumService) {}

  @Get(':activityId')
  getThread(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId') activityId: string,
  ) {
    return this.forum.getThread({ id: user.id, role: user.role }, activityId);
  }

  @Post(':activityId/posts')
  createPost(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId') activityId: string,
    @Body() dto: CreateForumPostDto,
  ) {
    return this.forum.createPost(
      { id: user.id, role: user.role },
      activityId,
      dto,
    );
  }

  @Patch('posts/:postId')
  updatePost(
    @CurrentUser() user: AuthenticatedUser,
    @Param('postId') postId: string,
    @Body() dto: UpdateForumPostDto,
  ) {
    return this.forum.updatePost({ id: user.id, role: user.role }, postId, dto);
  }

  @Delete('posts/:postId')
  deletePost(
    @CurrentUser() user: AuthenticatedUser,
    @Param('postId') postId: string,
  ) {
    return this.forum.deletePost({ id: user.id, role: user.role }, postId);
  }
}
