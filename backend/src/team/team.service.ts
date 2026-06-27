import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTeamMemberDto,
  ReorderTeamDto,
  UpdateTeamMemberDto,
} from './dto/team-member.dto';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Público ----

  findAll() {
    return this.prisma.teamMember.findMany({
      where: { isPublished: true },
      select: { id: true, name: true, role: true, photoUrl: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  // ---- Admin ----

  findAllAdmin() {
    return this.prisma.teamMember.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOneAdmin(id: string) {
    const member = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!member) {
      throw new NotFoundException('Integrante del equipo no encontrado');
    }
    return member;
  }

  async create(dto: CreateTeamMemberDto) {
    // Si no se especifica orden, se agrega al final de la lista.
    let displayOrder = dto.displayOrder;
    if (displayOrder === undefined) {
      const last = await this.prisma.teamMember.findFirst({
        orderBy: { displayOrder: 'desc' },
        select: { displayOrder: true },
      });
      displayOrder = (last?.displayOrder ?? -1) + 1;
    }
    return this.prisma.teamMember.create({ data: { ...dto, displayOrder } });
  }

  async reorder(dto: ReorderTeamDto) {
    const current = await this.prisma.teamMember.findMany({
      orderBy: { displayOrder: 'asc' },
      select: { id: true },
    });
    const currentSet = new Set(current.map((m) => m.id));
    const provided = dto.orderedIds.filter((id) => currentSet.has(id));
    const providedSet = new Set(provided);
    const rest = current.map((m) => m.id).filter((id) => !providedSet.has(id));
    const finalOrder = [...provided, ...rest];

    await this.prisma.$transaction(
      finalOrder.map((id, i) =>
        this.prisma.teamMember.update({
          where: { id },
          data: { displayOrder: i + 1 },
        }),
      ),
    );
    return { success: true };
  }

  async update(id: string, dto: UpdateTeamMemberDto) {
    await this.findOneAdmin(id);
    return this.prisma.teamMember.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.teamMember.delete({ where: { id } });
    return { success: true };
  }
}
