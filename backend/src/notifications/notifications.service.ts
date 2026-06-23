import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AnnouncementAudience,
  NotificationType,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto } from './dto/send-notification.dto';

// Una notificación lista para crear. `data` es contexto opcional (ids de
// curso/módulo) que el panel puede usar para enlazar más adelante.
export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Lectura (panel del usuario autenticado) ----

  listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  /**
   * Trae una notificación del usuario y la marca como leída (abrir = leer,
   * estilo Gmail). Lanza 404 si no existe o no es suya.
   */
  async openForUser(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }
    if (!notification.read) {
      await this.prisma.notification.update({
        where: { id },
        data: { read: true, readAt: new Date() },
      });
      return { ...notification, read: true, readAt: new Date() };
    }
    return notification;
  }

  async markRead(userId: string, id: string) {
    // Solo el dueño puede marcar la suya (filtra por userId además del id).
    const result = await this.prisma.notification.updateMany({
      where: { id, userId, read: false },
      data: { read: true, readAt: new Date() },
    });
    if (result.count === 0) {
      // O no existe, o no es del usuario, o ya estaba leída: confirmamos que
      // exista y sea suya para distinguir 404 de "ya leída".
      const exists = await this.prisma.notification.findFirst({
        where: { id, userId },
        select: { id: true },
      });
      if (!exists) {
        throw new NotFoundException('Notificación no encontrada');
      }
    }
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
    return { success: true };
  }

  // ---- Escritura interna (la disparan otros servicios) ----

  /**
   * Crea varias notificaciones de una sola vez. Pensado para fan-out: notificar
   * a todos los estudiantes recién inscritos o a los docentes recién asignados.
   * Acepta un `tx` opcional para correr dentro de la misma transacción que el
   * cambio que las origina.
   */
  createMany(inputs: CreateNotificationInput[], tx?: Prisma.TransactionClient) {
    if (inputs.length === 0) return Promise.resolve({ count: 0 });
    const client = tx ?? this.prisma;
    return client.notification.createMany({
      data: inputs.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data ?? Prisma.JsonNull,
      })),
    });
  }

  // ---- Envío manual del administrador (aviso a uno/varios/masivo) ----

  /**
   * Envía un aviso (`ANNOUNCEMENT`) a la audiencia indicada: todos los docentes
   * y/o estudiantes, o una lista explícita. Nunca envía a administradores ni a
   * usuarios inactivos. Registra el envío en `Announcement` (historial) y crea
   * las notificaciones en una misma transacción. Devuelve cuántas se crearon.
   */
  async broadcast(dto: SendNotificationDto, senderId: string) {
    const recipientIds = await this.resolveAudience(dto);
    if (recipientIds.length === 0) {
      throw new BadRequestException('No hay destinatarios para este envío');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.announcement.create({
        data: {
          title: dto.title,
          body: dto.body,
          audience: dto.audience,
          recipientCount: recipientIds.length,
          senderId,
        },
      });
      await this.createMany(
        recipientIds.map((userId) => ({
          userId,
          type: NotificationType.ANNOUNCEMENT,
          title: dto.title,
          body: dto.body,
          data: { audience: dto.audience },
        })),
        tx,
      );
    });
    return { count: recipientIds.length };
  }

  /**
   * Historial de avisos enviados (más reciente primero), paginado y filtrable
   * por audiencia y por texto (título o mensaje). Devuelve la página pedida más
   * los metadatos de paginación.
   */
  async listAnnouncements(opts: {
    page?: number;
    audience?: string;
    q?: string;
  }) {
    const pageSize = 8;
    const page = Math.max(1, Math.trunc(opts.page ?? 1) || 1);

    const where: Prisma.AnnouncementWhereInput = {};
    if (
      opts.audience &&
      (Object.values(AnnouncementAudience) as string[]).includes(opts.audience)
    ) {
      where.audience = opts.audience as AnnouncementAudience;
    }
    const q = opts.q?.trim();
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.announcement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { sender: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  // Resuelve la audiencia a una lista de ids de usuario (solo PROFESSOR/STUDENT
  // activos). Para SELECTED valida que los ids existan y tengan rol válido.
  private async resolveAudience(dto: SendNotificationDto): Promise<string[]> {
    if (dto.audience === 'SELECTED') {
      const ids = [...new Set(dto.userIds ?? [])];
      if (ids.length === 0) return [];
      const found = await this.prisma.user.findMany({
        where: {
          id: { in: ids },
          isActive: true,
          role: { in: [Role.PROFESSOR, Role.STUDENT] },
        },
        select: { id: true },
      });
      if (found.length !== ids.length) {
        throw new BadRequestException(
          'Uno o más destinatarios no son válidos (deben ser docentes o estudiantes activos)',
        );
      }
      return found.map((u) => u.id);
    }

    const roles =
      dto.audience === 'PROFESSORS'
        ? [Role.PROFESSOR]
        : dto.audience === 'STUDENTS'
          ? [Role.STUDENT]
          : [Role.PROFESSOR, Role.STUDENT];

    const users = await this.prisma.user.findMany({
      where: { isActive: true, role: { in: roles } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
}
