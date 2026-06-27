import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePartnerDto,
  ReorderPartnersDto,
  UpdatePartnerDto,
} from './dto/partner.dto';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Público ----

  findAll() {
    return this.prisma.partner.findMany({
      where: { isPublished: true },
      select: { id: true, name: true, logoUrl: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  // ---- Admin ----

  findAllAdmin() {
    return this.prisma.partner.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOneAdmin(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) {
      throw new NotFoundException('Institución aliada no encontrada');
    }
    return partner;
  }

  async create(dto: CreatePartnerDto) {
    // Si no se especifica orden, se agrega al final de la lista.
    let displayOrder = dto.displayOrder;
    if (displayOrder === undefined) {
      const last = await this.prisma.partner.findFirst({
        orderBy: { displayOrder: 'desc' },
        select: { displayOrder: true },
      });
      displayOrder = (last?.displayOrder ?? -1) + 1;
    }
    return this.prisma.partner.create({ data: { ...dto, displayOrder } });
  }

  /** Reordena las instituciones según `orderedIds` (drag-and-drop del panel). */
  async reorder(dto: ReorderPartnersDto) {
    const current = await this.prisma.partner.findMany({
      orderBy: { displayOrder: 'asc' },
      select: { id: true },
    });
    const currentSet = new Set(current.map((p) => p.id));
    const provided = dto.orderedIds.filter((id) => currentSet.has(id));
    const providedSet = new Set(provided);
    const rest = current.map((p) => p.id).filter((id) => !providedSet.has(id));
    const finalOrder = [...provided, ...rest];

    await this.prisma.$transaction(
      finalOrder.map((id, i) =>
        this.prisma.partner.update({
          where: { id },
          data: { displayOrder: i + 1 },
        }),
      ),
    );
    return { success: true };
  }

  async update(id: string, dto: UpdatePartnerDto) {
    await this.findOneAdmin(id);
    return this.prisma.partner.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.partner.delete({ where: { id } });
    return { success: true };
  }
}
