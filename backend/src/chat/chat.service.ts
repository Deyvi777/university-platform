import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// Un mensaje serializado tal como lo consumen el front y el gateway.
export interface ChatMessageDto {
  id: string;
  moduleId: string;
  studentId: string;
  teacherId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
}

// Un contacto con el que conversar dentro de un módulo (el "otro" rol) + cuántos
// mensajes sin leer envió.
export interface ChatContactDto {
  id: string;
  firstName: string;
  lastName: string;
  unread: number;
}

// Identidad de una conversación (terna módulo + estudiante + docente).
interface Conversation {
  moduleId: string;
  studentId: string;
  teacherId: string;
}

function conversationKey(c: Conversation): string {
  return `${c.moduleId}:${c.studentId}:${c.teacherId}`;
}

function serialize(m: {
  id: string;
  moduleId: string;
  studentId: string;
  teacherId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
}): ChatMessageDto {
  return {
    id: m.id,
    moduleId: m.moduleId,
    studentId: m.studentId,
    teacherId: m.teacherId,
    senderId: m.senderId,
    body: m.body,
    createdAt: m.createdAt,
    readAt: m.readAt,
  };
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Verifica un token de chat (igual que la conexión WS) cargando al usuario y
   * confirmando que esté activo. Devuelve su id y rol. El gateway lo usa al
   * autenticar la conexión socket.
   */
  async getActiveUser(userId: string): Promise<{ id: string; role: Role }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return { id: user.id, role: user.role };
  }

  // ── Contactos con los que conversar dentro de un módulo ──────────────────────

  async getContacts(
    userId: string,
    role: Role,
    moduleId: string,
  ): Promise<ChatContactDto[]> {
    const module = await this.loadModule(moduleId);

    if (role === Role.STUDENT) {
      // El estudiante conversa con los docentes del módulo (debe estar inscrito
      // y el módulo/curso no estar en borrador).
      await this.ensureStudentCanSee(userId, module);
      const teachers = await this.prisma.moduleTeacher.findMany({
        where: { moduleId },
        orderBy: { assignedAt: 'asc' },
        select: {
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      const unread = await this.unreadByCounterpart(
        moduleId,
        'student',
        userId,
      );
      return teachers.map((t) => ({
        id: t.teacher.id,
        firstName: t.teacher.firstName,
        lastName: t.teacher.lastName,
        unread: unread.get(t.teacher.id) ?? 0,
      }));
    }

    // Docente (o admin): conversa con los estudiantes inscritos en el curso.
    await this.ensureTeaches(userId, role, moduleId);
    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: module.courseId },
      orderBy: { student: { lastName: 'asc' } },
      select: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    const unread = await this.unreadByCounterpart(moduleId, 'teacher', userId);
    return enrollments.map((e) => ({
      id: e.student.id,
      firstName: e.student.firstName,
      lastName: e.student.lastName,
      unread: unread.get(e.student.id) ?? 0,
    }));
  }

  // ── Historial de una conversación (marca como leídos los entrantes) ──────────

  async getMessages(
    userId: string,
    role: Role,
    moduleId: string,
    counterpartId: string,
  ): Promise<ChatMessageDto[]> {
    const conv = await this.resolveConversation(
      userId,
      role,
      moduleId,
      counterpartId,
    );
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        moduleId: conv.moduleId,
        studentId: conv.studentId,
        teacherId: conv.teacherId,
      },
      orderBy: { createdAt: 'asc' },
    });

    await this.markConversationRead(userId, conv);

    return messages.map(serialize);
  }

  // ── Envío de un mensaje ──────────────────────────────────────────────────────

  async sendMessage(
    userId: string,
    role: Role,
    moduleId: string,
    counterpartId: string,
    rawBody: string,
  ): Promise<{ message: ChatMessageDto; recipientId: string }> {
    const conv = await this.resolveConversation(
      userId,
      role,
      moduleId,
      counterpartId,
    );
    const body = rawBody.trim();
    if (!body) throw new BadRequestException('Mensaje vacío');

    const created = await this.prisma.chatMessage.create({
      data: {
        moduleId: conv.moduleId,
        studentId: conv.studentId,
        teacherId: conv.teacherId,
        senderId: userId,
        body: body.slice(0, 4000),
      },
    });

    const recipientId =
      userId === conv.studentId ? conv.teacherId : conv.studentId;
    await this.notifyRecipient(userId, recipientId, conv, body);

    return { message: serialize(created), recipientId };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Crea (colapsando) una notificación de campana para el receptor. Antes de
  // crear, marca como leídas las anteriores no leídas de la MISMA conversación,
  // para no acumular una por mensaje en el centro de notificaciones.
  private async notifyRecipient(
    senderId: string,
    recipientId: string,
    conv: Conversation,
    body: string,
  ) {
    const [sender, module] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: senderId },
        select: { firstName: true, lastName: true },
      }),
      this.prisma.courseModule.findUnique({
        where: { id: conv.moduleId },
        select: { name: true, course: { select: { name: true } } },
      }),
    ]);
    const key = conversationKey(conv);

    await this.prisma.notification.updateMany({
      where: {
        userId: recipientId,
        type: NotificationType.MESSAGE,
        read: false,
        data: { path: ['conversationKey'], equals: key },
      },
      data: { read: true, readAt: new Date() },
    });

    const senderName = sender
      ? `${sender.lastName} ${sender.firstName}`
      : 'Alguien';
    const preview = body.length > 280 ? `${body.slice(0, 280)}…` : body;
    // Cuerpo estructurado: encabezado «Mensaje» + el texto, una separación, y
    // el contexto (módulo/programa) aparte. El front preserva los saltos de
    // línea (NotificationBody usa whitespace-pre-line) y resalta los «…».
    const context = module
      ? `Módulo «${module.name}» · Programa «${module.course.name}»`
      : '';
    await this.notifications.createMany([
      {
        userId: recipientId,
        type: NotificationType.MESSAGE,
        title: `Nuevo mensaje de ${senderName}`,
        body: context
          ? `«Mensaje»:\n${preview}\n\n${context}`
          : `«Mensaje»:\n${preview}`,
        data: {
          conversationKey: key,
          moduleId: conv.moduleId,
          fromUserId: senderId,
          chat: true,
        },
      },
    ]);
  }

  // Marca como leídos los mensajes entrantes de la conversación + sus
  // notificaciones de campana pendientes.
  private async markConversationRead(userId: string, conv: Conversation) {
    await this.prisma.chatMessage.updateMany({
      where: {
        moduleId: conv.moduleId,
        studentId: conv.studentId,
        teacherId: conv.teacherId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    const key = conversationKey(conv);
    const res = await this.prisma.notification.updateMany({
      where: {
        userId,
        type: NotificationType.MESSAGE,
        read: false,
        data: { path: ['conversationKey'], equals: key },
      },
      data: { read: true, readAt: new Date() },
    });
    // Si había notificaciones de esta conversación, avisa a la campana del
    // usuario (por WebSocket) para que las marque leídas en vivo.
    if (res.count > 0) {
      this.notifications.emitConversationRead(userId, key);
    }
  }

  // Cuenta de no leídos por contraparte dentro de un módulo, para los badges.
  private async unreadByCounterpart(
    moduleId: string,
    viewer: 'student' | 'teacher',
    userId: string,
  ): Promise<Map<string, number>> {
    const rows = await this.prisma.chatMessage.groupBy({
      by: viewer === 'student' ? ['teacherId'] : ['studentId'],
      where: {
        moduleId,
        ...(viewer === 'student'
          ? { studentId: userId }
          : { teacherId: userId }),
        senderId: { not: userId },
        readAt: null,
      },
      _count: { _all: true },
    });
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = viewer === 'student' ? r.teacherId : r.studentId;
      map.set(key, r._count._all);
    }
    return map;
  }

  // Resuelve y autoriza una conversación entre `userId` (según su rol) y la
  // contraparte. 404 si el acceso no es válido (sin revelar existencia).
  private async resolveConversation(
    userId: string,
    role: Role,
    moduleId: string,
    counterpartId: string,
  ): Promise<Conversation> {
    const module = await this.loadModule(moduleId);

    if (role === Role.STUDENT) {
      const studentId = userId;
      const teacherId = counterpartId;
      await this.ensureStudentCanSee(studentId, module);
      const teaches = await this.prisma.moduleTeacher.findUnique({
        where: { moduleId_teacherId: { moduleId, teacherId } },
        select: { id: true },
      });
      if (!teaches) throw new NotFoundException('Conversación no encontrada');
      return { moduleId, studentId, teacherId };
    }

    // Docente. A diferencia de otras vistas, aquí el ADMIN NO pasa: una
    // conversación exige que el lado docente sea un ModuleTeacher real — el
    // estudiante solo ve como contactos a los docentes del módulo, así que un
    // admin escribiendo crearía una conversación que el estudiante nunca vería.
    const teacherId = userId;
    const studentId = counterpartId;
    const teaches = await this.prisma.moduleTeacher.findUnique({
      where: { moduleId_teacherId: { moduleId, teacherId } },
      select: { id: true },
    });
    if (!teaches) throw new NotFoundException('Conversación no encontrada');
    const enrolled = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId: module.courseId },
      },
      select: { id: true },
    });
    if (!enrolled) throw new NotFoundException('Conversación no encontrada');
    return { moduleId, studentId, teacherId };
  }

  private async loadModule(moduleId: string) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: {
        id: true,
        status: true,
        courseId: true,
        course: { select: { status: true } },
      },
    });
    if (!module) throw new NotFoundException('Módulo no encontrado');
    return module;
  }

  // El estudiante solo ve módulos de cursos en los que está inscrito y que no
  // estén en borrador (igual que la vista de aprendizaje).
  private async ensureStudentCanSee(
    studentId: string,
    module: {
      courseId: string;
      status: string;
      course: { status: string };
    },
  ) {
    const enrolled = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId: module.courseId },
      },
      select: { id: true },
    });
    if (
      !enrolled ||
      module.course.status === 'DRAFT' ||
      module.status === 'DRAFT'
    ) {
      throw new NotFoundException('Módulo no encontrado');
    }
  }

  // El docente solo conversa en módulos que dicta; el ADMIN puede en cualquiera.
  private async ensureTeaches(userId: string, role: Role, moduleId: string) {
    if (role === Role.ADMIN) return;
    const rel = await this.prisma.moduleTeacher.findUnique({
      where: { moduleId_teacherId: { moduleId, teacherId: userId } },
      select: { id: true },
    });
    if (!rel) throw new NotFoundException('Módulo no encontrado');
  }

  // Total de mensajes de chat sin leer del usuario (para un badge global, opc.).
  unreadTotal(userId: string): Promise<number> {
    return this.prisma.chatMessage.count({
      where: {
        senderId: { not: userId },
        readAt: null,
        OR: [{ studentId: userId }, { teacherId: userId }],
      },
    });
  }
}
