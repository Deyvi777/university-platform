import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/utils/slugify';
import {
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Público ----

  findAllActive() {
    return this.prisma.programCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  // ---- Admin ----

  findAllAdmin() {
    return this.prisma.programCategory.findMany({
      include: { _count: { select: { programs: true } } },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOneAdmin(id: string) {
    const category = await this.prisma.programCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = await this.buildUniqueSlug(dto.slug ?? slugify(dto.name));
    // Si no se especifica orden, se agrega al final de la lista.
    let displayOrder = dto.displayOrder;
    if (displayOrder === undefined) {
      const last = await this.prisma.programCategory.findFirst({
        orderBy: { displayOrder: 'desc' },
        select: { displayOrder: true },
      });
      displayOrder = (last?.displayOrder ?? -1) + 1;
    }
    return this.prisma.programCategory.create({
      data: { ...dto, slug, displayOrder },
    });
  }

  /** Reordena las categorías según `orderedIds` (drag-and-drop del panel). */
  async reorder(dto: ReorderCategoriesDto) {
    const current = await this.prisma.programCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      select: { id: true },
    });
    const currentSet = new Set(current.map((c) => c.id));
    const provided = dto.orderedIds.filter((id) => currentSet.has(id));
    const providedSet = new Set(provided);
    const rest = current.map((c) => c.id).filter((id) => !providedSet.has(id));
    const finalOrder = [...provided, ...rest];

    await this.prisma.$transaction(
      finalOrder.map((id, i) =>
        this.prisma.programCategory.update({
          where: { id },
          data: { displayOrder: i + 1 },
        }),
      ),
    );
    return { success: true };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOneAdmin(id);
    const data = { ...dto };
    if (dto.slug !== undefined) {
      data.slug = await this.buildUniqueSlug(dto.slug, id);
    }
    return this.prisma.programCategory.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    const programs = await this.prisma.program.count({
      where: { categoryId: id },
    });
    if (programs > 0) {
      throw new ConflictException(
        'No se puede eliminar una categoría con programas asignados',
      );
    }
    await this.prisma.programCategory.delete({ where: { id } });
    return { success: true };
  }

  private async buildUniqueSlug(base: string, excludeId?: string) {
    const root = slugify(base);
    if (!root) {
      throw new ConflictException('No se pudo generar un slug válido');
    }

    let candidate = root;
    let suffix = 2;
    while (true) {
      const existing = await this.prisma.programCategory.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing || existing.id === excludeId) {
        return candidate;
      }
      candidate = `${root}-${suffix++}`;
    }
  }
}
