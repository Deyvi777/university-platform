import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

// Nunca exponer el hash de contraseña hacia el panel.
const safeSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
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
}
