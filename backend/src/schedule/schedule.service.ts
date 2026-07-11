import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModuleStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateClassSessionDto,
  UpdateClassSessionDto,
} from './dto/schedule.dto';

const MODULE_FINISHED_MSG =
  'El módulo está concluido; no se pueden realizar cambios.';

/** Convierte un Date (@db.Date, medianoche UTC) a "YYYY-MM-DD". */
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parsea "YYYY-MM-DD" a un Date en medianoche UTC (estable para @db.Date). */
function fromISODate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

const SESSION_SELECT = {
  id: true,
  date: true,
  startTime: true,
  endTime: true,
  title: true,
  location: true,
} as const;

function serialize(s: {
  id: string;
  date: Date;
  startTime: string;
  endTime: string | null;
  title: string | null;
  location: string | null;
}) {
  return { ...s, date: toISODate(s.date) };
}

/**
 * Cronograma de clases de un módulo. Escritura: docentes del módulo (o ADMIN,
 * que gestiona como docente), bloqueada en módulos concluidos. Lectura: además
 * el estudiante inscrito (módulo no borrador, curso ACTIVE/FINISHED) — 404 en
 * cualquier otro caso (no se revela existencia), como el resto de `/me/*`.
 */
@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, moduleId: string) {
    await this.ensureCanRead(userId, moduleId);
    const rows = await this.prisma.classSession.findMany({
      where: { moduleId },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      select: SESSION_SELECT,
    });
    return rows.map(serialize);
  }

  async create(userId: string, moduleId: string, dto: CreateClassSessionDto) {
    await this.ensureTeaches(userId, moduleId);
    await this.ensureModuleNotFinished(moduleId);
    this.ensureTimeRange(dto.startTime, dto.endTime ?? null);
    const row = await this.prisma.classSession.create({
      data: {
        moduleId,
        date: fromISODate(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime ?? null,
        title: dto.title ?? null,
        location: dto.location ?? null,
      },
      select: SESSION_SELECT,
    });
    return serialize(row);
  }

  async update(userId: string, sessionId: string, dto: UpdateClassSessionDto) {
    const existing = await this.findSession(sessionId);
    await this.ensureTeaches(userId, existing.moduleId);
    await this.ensureModuleNotFinished(existing.moduleId);
    const startTime = dto.startTime ?? existing.startTime;
    const endTime = dto.endTime !== undefined ? dto.endTime : existing.endTime;
    this.ensureTimeRange(startTime, endTime);
    const row = await this.prisma.classSession.update({
      where: { id: sessionId },
      data: {
        ...(dto.date !== undefined ? { date: fromISODate(dto.date) } : {}),
        ...(dto.startTime !== undefined ? { startTime: dto.startTime } : {}),
        ...(dto.endTime !== undefined ? { endTime: dto.endTime } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
      },
      select: SESSION_SELECT,
    });
    return serialize(row);
  }

  async remove(userId: string, sessionId: string) {
    const existing = await this.findSession(sessionId);
    await this.ensureTeaches(userId, existing.moduleId);
    await this.ensureModuleNotFinished(existing.moduleId);
    await this.prisma.classSession.delete({ where: { id: sessionId } });
    return { ok: true };
  }

  // ── Autorización (mismo criterio que module-content/grading) ───────────────

  private async findSession(sessionId: string) {
    const s = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      select: { id: true, moduleId: true, startTime: true, endTime: true },
    });
    if (!s) throw new NotFoundException('Clase no encontrada');
    return s;
  }

  private async ensureTeaches(userId: string, moduleId: string) {
    const rel = await this.prisma.moduleTeacher.findUnique({
      where: { moduleId_teacherId: { moduleId, teacherId: userId } },
      select: { id: true },
    });
    if (rel) return;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === Role.ADMIN) return;
    throw new NotFoundException('Módulo no encontrado');
  }

  /** Lectura: docente/ADMIN, o estudiante inscrito con el módulo visible. */
  private async ensureCanRead(userId: string, moduleId: string) {
    const asStudent = await this.prisma.courseModule.findFirst({
      where: {
        id: moduleId,
        status: { not: ModuleStatus.DRAFT },
        course: {
          status: { in: ['ACTIVE', 'FINISHED'] },
          enrollments: { some: { studentId: userId } },
        },
      },
      select: { id: true },
    });
    if (asStudent) return;
    await this.ensureTeaches(userId, moduleId);
  }

  private async ensureModuleNotFinished(moduleId: string) {
    const mod = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: { status: true },
    });
    if (mod?.status === ModuleStatus.FINISHED) {
      throw new ForbiddenException(MODULE_FINISHED_MSG);
    }
  }

  /** Con hora fin presente, debe ser posterior a la de inicio ("HH:mm" compara lexicográficamente). */
  private ensureTimeRange(startTime: string, endTime: string | null) {
    if (endTime !== null && endTime <= startTime) {
      throw new BadRequestException(
        'La hora de fin debe ser posterior a la de inicio',
      );
    }
  }
}
