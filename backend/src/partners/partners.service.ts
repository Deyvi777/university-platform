import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto, UpdatePartnerDto } from './dto/partner.dto';

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

  create(dto: CreatePartnerDto) {
    return this.prisma.partner.create({ data: dto });
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
