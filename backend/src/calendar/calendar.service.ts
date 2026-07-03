import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto, UpdateReminderDto } from './dto/calendar.dto';

/** Convierte un Date (@db.Date, medianoche UTC) a "YYYY-MM-DD". */
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parsea "YYYY-MM-DD" a un Date en medianoche UTC (estable para @db.Date). */
function fromISODate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Datos del calendario del usuario: fechas plazo de actividades (según rol) +
   * sus recordatorios. Los feriados se calculan en el cliente (son fijos por
   * año, no dependen del usuario).
   */
  async overview(userId: string, role: Role) {
    const [deadlines, reminders] = await Promise.all([
      this.deadlines(userId, role),
      this.listReminders(userId),
    ]);
    return { deadlines, reminders };
  }

  /**
   * Actividades con fecha límite relevantes para el usuario:
   * - STUDENT: cursos en los que está inscrito (ACTIVE/FINISHED), módulos no
   *   borrador, actividades publicadas.
   * - PROFESSOR: módulos que dicta (todas, prepara contenido).
   * - ADMIN: ninguna (su panel no tiene cursos propios).
   */
  async deadlines(userId: string, role: Role) {
    if (role === Role.ADMIN) return [];

    const where =
      role === Role.PROFESSOR
        ? {
            kind: 'ACTIVITY' as const,
            dueDate: { not: null },
            module: { teachers: { some: { teacherId: userId } } },
          }
        : {
            kind: 'ACTIVITY' as const,
            dueDate: { not: null },
            isPublished: true,
            module: {
              status: { not: 'DRAFT' as const },
              course: {
                status: { in: ['ACTIVE' as const, 'FINISHED' as const] },
                enrollments: { some: { studentId: userId } },
              },
            },
          };

    const rows = await this.prisma.moduleContent.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        title: true,
        dueDate: true,
        module: {
          select: {
            id: true,
            name: true,
            order: true,
            course: { select: { id: true, name: true } },
          },
        },
      },
    });

    return rows
      .filter((r) => r.dueDate !== null)
      .map((r) => ({
        contentId: r.id,
        title: r.title,
        dueDate: toISODate(r.dueDate as Date),
        moduleId: r.module.id,
        moduleName: r.module.name,
        moduleOrder: r.module.order,
        courseId: r.module.course.id,
        courseName: r.module.course.name,
      }));
  }

  async listReminders(userId: string) {
    const rows = await this.prisma.calendarReminder.findMany({
      where: { userId },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, date: true, note: true },
    });
    return rows.map((r) => ({
      id: r.id,
      date: toISODate(r.date),
      note: r.note,
    }));
  }

  async createReminder(userId: string, dto: CreateReminderDto) {
    const r = await this.prisma.calendarReminder.create({
      data: { userId, date: fromISODate(dto.date), note: dto.note },
      select: { id: true, date: true, note: true },
    });
    return { id: r.id, date: toISODate(r.date), note: r.note };
  }

  async updateReminder(userId: string, id: string, dto: UpdateReminderDto) {
    await this.ensureOwner(userId, id);
    const r = await this.prisma.calendarReminder.update({
      where: { id },
      data: {
        ...(dto.note !== undefined ? { note: dto.note } : {}),
        ...(dto.date !== undefined ? { date: fromISODate(dto.date) } : {}),
      },
      select: { id: true, date: true, note: true },
    });
    return { id: r.id, date: toISODate(r.date), note: r.note };
  }

  async removeReminder(userId: string, id: string) {
    await this.ensureOwner(userId, id);
    await this.prisma.calendarReminder.delete({ where: { id } });
    return { ok: true };
  }

  /** 404 si no existe, 403 si es de otro usuario (no se revela su existencia). */
  private async ensureOwner(userId: string, id: string) {
    const r = await this.prisma.calendarReminder.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!r) throw new NotFoundException('Recordatorio no encontrado');
    if (r.userId !== userId) throw new ForbiddenException('No autorizado');
  }
}
