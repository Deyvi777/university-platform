import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { bulkStudentRowSchema } from './dto/bulk-user.dto';

/** Error de una fila en la carga masiva (índice 0-based dentro del arreglo). */
export interface BulkRowError {
  index: number;
  email?: string;
  message: string;
}

export interface BulkResult {
  total: number;
  created: number;
  errors: BulkRowError[];
}

// Nunca exponer el hash de contraseña hacia el panel.
const safeSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  idDocument: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAllAdmin(role?: string) {
    const isFilterable =
      role === Role.PROFESSOR || role === Role.STUDENT || role === Role.ADMIN;
    return this.prisma.user.findMany({
      where: isFilterable ? { role: role } : undefined,
      select: safeSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneAdmin(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: safeSelect,
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: await argon2.hash(dto.password),
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        idDocument: dto.idDocument ?? null,
        role: dto.role,
        isActive: dto.isActive,
      },
      select: safeSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOneAdmin(id);

    if (dto.email) {
      const clash = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (clash && clash.id !== id) {
        throw new ConflictException('Ya existe un usuario con ese correo');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        // `undefined` deja el valor intacto; `null` (idDocument) lo limpia.
        phone: dto.phone,
        idDocument: dto.idDocument,
        role: dto.role,
        isActive: dto.isActive,
        // Solo re-hashea si se envía una contraseña nueva.
        ...(dto.password ? { password: await argon2.hash(dto.password) } : {}),
      },
      select: safeSelect,
    });
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Carga masiva de ESTUDIANTES (carga parcial): valida cada fila con Zod, crea
   * las válidas y reporta las que fallan (datos inválidos, correo duplicado en
   * el archivo o ya existente en la BD). Nunca aborta el lote por una fila mala.
   */
  async bulkCreateStudents(
    rows: Record<string, unknown>[],
  ): Promise<BulkResult> {
    const errors: BulkRowError[] = [];
    let created = 0;
    const seenEmails = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const parsed = bulkStudentRowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        const rawEmail = rows[i]?.email;
        errors.push({
          index: i,
          email: typeof rawEmail === 'string' ? rawEmail : undefined,
          message: parsed.error.issues[0]?.message ?? 'Datos inválidos',
        });
        continue;
      }

      const data = parsed.data;
      const email = data.email.toLowerCase();

      if (seenEmails.has(email)) {
        errors.push({
          index: i,
          email,
          message: 'Correo duplicado dentro del archivo',
        });
        continue;
      }
      seenEmails.add(email);

      try {
        await this.prisma.user.create({
          data: {
            email,
            password: await argon2.hash(data.password),
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            idDocument: data.idDocument ?? null,
            role: Role.STUDENT,
            isActive: true,
          },
        });
        created++;
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          errors.push({
            index: i,
            email,
            message: 'Ya existe un usuario con ese correo',
          });
        } else {
          errors.push({ index: i, email, message: 'No se pudo registrar' });
        }
      }
    }

    return { total: rows.length, created, errors };
  }
}
