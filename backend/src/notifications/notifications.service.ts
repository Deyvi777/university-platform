import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AnnouncementAudience,
  type Notification,
  NotificationType,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

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
   * Crea varias notificaciones de una sola vez y devuelve las filas creadas.
   * Pensado para fan-out: notificar a todos los estudiantes recién inscritos o a
   * los docentes recién asignados. Acepta un `tx` opcional para correr dentro de
   * la misma transacción que el cambio que las origina.
   *
   * **Push en tiempo real:** si NO corre en una transacción, empuja cada
   * notificación por WebSocket inmediatamente. Si SÍ corre en una transacción
   * (`tx`), no emite aquí (podría revertirse): el llamador debe llamar a
   * `emitNotifications(rows)` tras confirmar (commit) la transacción.
   */
  async createMany(
    inputs: CreateNotificationInput[],
    tx?: Prisma.TransactionClient,
  ): Promise<Notification[]> {
    if (inputs.length === 0) return [];
    const client = tx ?? this.prisma;
    const rows = await client.notification.createManyAndReturn({
      data: inputs.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data ?? Prisma.JsonNull,
      })),
    });
    if (!tx) this.emitNotifications(rows);
    return rows;
  }

  /**
   * Empuja por WebSocket cada notificación a la sala personal de su destinatario
   * (`notification:new`). Lo usan los llamadores que crean en transacción, tras
   * el commit.
   */
  emitNotifications(rows: Notification[]) {
    for (const n of rows) {
      this.gateway.emitToUser(n.userId, 'notification:new', {
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        readAt: n.readAt,
        data: n.data,
        createdAt: n.createdAt,
      });
    }
  }

  /**
   * Avisa por WebSocket al usuario que marque como leídas, en su campana, las
   * notificaciones de una conversación de chat (cuando abre ese chat). El front
   * empareja por `conversationKey` en `data`.
   */
  emitConversationRead(userId: string, conversationKey: string) {
    this.gateway.emitToUser(userId, 'notification:read', { conversationKey });
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

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.announcement.create({
        data: {
          title: dto.title,
          body: dto.body,
          audience: dto.audience,
          recipientCount: recipientIds.length,
          senderId,
        },
      });
      return this.createMany(
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
    // Push tras el commit (no dentro de la transacción, que podría revertirse).
    this.emitNotifications(created);
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
