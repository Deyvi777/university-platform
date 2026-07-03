import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, ContentKind, ModuleStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateForumPostDto, UpdateForumPostDto } from './dto/forum.dto';

const MODULE_FINISHED_MSG =
  'El módulo está concluido; no se pueden realizar cambios.';

interface Viewer {
  id: string;
  role: Role;
}

@Injectable()
export class ForumService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Autoriza al usuario sobre una actividad de tipo FORUM y devuelve el contenido
   * + si es docente del módulo. Docente/ADMIN del módulo o estudiante inscrito
   * (curso/módulo no en borrador, actividad publicada). 404 si no corresponde.
   */
  private async authorize(viewer: Viewer, contentId: string) {
    const content = await this.prisma.moduleContent.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        kind: true,
        activityType: true,
        title: true,
        instructions: true,
        isPublished: true,
        moduleId: true,
        module: {
          select: {
            id: true,
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
      content.activityType !== ActivityType.FORUM
    ) {
      throw new NotFoundException('Foro no encontrado');
    }

    // Docente del módulo o ADMIN.
    const teaching = await this.prisma.moduleTeacher.findUnique({
      where: {
        moduleId_teacherId: {
          moduleId: content.moduleId,
          teacherId: viewer.id,
        },
      },
      select: { id: true },
    });
    const isTeacher = Boolean(teaching) || viewer.role === Role.ADMIN;

    if (!isTeacher) {
      // Estudiante: inscrito + curso/módulo visibles + actividad publicada.
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
        throw new NotFoundException('Foro no encontrado');
      }
    }

    return { content, isTeacher };
  }

  /** Hilo completo del foro (mensajes planos; el cliente los anida por parentId). */
  async getThread(viewer: Viewer, contentId: string) {
    const { content, isTeacher } = await this.authorize(viewer, contentId);

    const posts = await this.prisma.forumPost.findMany({
      where: { contentId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        parentId: true,
        body: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return {
      activity: {
        id: content.id,
        title: content.title,
        instructions: content.instructions,
        moduleStatus: content.module.status,
      },
      viewer: { id: viewer.id, isTeacher },
      // Un módulo concluido deja el foro en solo lectura.
      canPost: content.module.status !== ModuleStatus.FINISHED,
      posts: posts.map((p) => ({
        id: p.id,
        parentId: p.parentId,
        body: p.body,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        edited: p.updatedAt.getTime() !== p.createdAt.getTime(),
        author: p.author,
        isMine: p.author.id === viewer.id,
        // El autor edita/borra lo suyo; el docente/ADMIN puede moderar (borrar).
        canDelete: p.author.id === viewer.id || isTeacher,
      })),
    };
  }

  /** Publica un mensaje o una respuesta (parentId). */
  async createPost(viewer: Viewer, contentId: string, dto: CreateForumPostDto) {
    const { content } = await this.authorize(viewer, contentId);
    if (content.module.status === ModuleStatus.FINISHED) {
      throw new ForbiddenException(MODULE_FINISHED_MSG);
    }
    // Una respuesta debe apuntar a un mensaje RAÍZ del mismo foro (un solo
    // nivel de anidado: responder a una respuesta crearía un post que la UI
    // nunca renderiza).
    if (dto.parentId) {
      const parent = await this.prisma.forumPost.findUnique({
        where: { id: dto.parentId },
        select: { contentId: true, parentId: true },
      });
      if (
        !parent ||
        parent.contentId !== contentId ||
        parent.parentId !== null
      ) {
        throw new NotFoundException('Mensaje no encontrado');
      }
    }
    return this.prisma.forumPost.create({
      data: {
        contentId,
        authorId: viewer.id,
        parentId: dto.parentId ?? null,
        body: dto.body.trim(),
      },
      select: { id: true },
    });
  }

  /** Edita un mensaje propio. */
  async updatePost(viewer: Viewer, postId: string, dto: UpdateForumPostDto) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
      select: {
        authorId: true,
        content: { select: { module: { select: { status: true } } } },
      },
    });
    if (!post) throw new NotFoundException('Mensaje no encontrado');
    if (post.authorId !== viewer.id) {
      throw new ForbiddenException('Solo puedes editar tus propios mensajes');
    }
    if (post.content.module.status === ModuleStatus.FINISHED) {
      throw new ForbiddenException(MODULE_FINISHED_MSG);
    }
    return this.prisma.forumPost.update({
      where: { id: postId },
      data: { body: dto.body.trim() },
      select: { id: true },
    });
  }

  /** Borra un mensaje: el autor el suyo, o el docente/ADMIN cualquiera (modera). */
  async deletePost(viewer: Viewer, postId: string) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
      select: {
        authorId: true,
        contentId: true,
        content: {
          select: { moduleId: true, module: { select: { status: true } } },
        },
      },
    });
    if (!post) throw new NotFoundException('Mensaje no encontrado');
    if (post.content.module.status === ModuleStatus.FINISHED) {
      throw new ForbiddenException(MODULE_FINISHED_MSG);
    }
    if (post.authorId !== viewer.id) {
      // No es el autor: solo docente del módulo o ADMIN puede borrar.
      const teaching = await this.prisma.moduleTeacher.findUnique({
        where: {
          moduleId_teacherId: {
            moduleId: post.content.moduleId,
            teacherId: viewer.id,
          },
        },
        select: { id: true },
      });
      if (!teaching && viewer.role !== Role.ADMIN) {
        throw new ForbiddenException('No puedes borrar este mensaje');
      }
    }
    await this.prisma.forumPost.delete({ where: { id: postId } });
    return { ok: true };
  }
}
