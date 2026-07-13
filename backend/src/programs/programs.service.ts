import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/utils/slugify';
import {
  CreateProgramDto,
  ReorderProgramsDto,
  UpdateProgramDto,
} from './dto/program.dto';

const categorySelect = { id: true, name: true, slug: true } as const;

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Público ----

  findAll(categorySlug?: string) {
    return this.prisma.program.findMany({
      where: {
        isPublished: true,
        ...(categorySlug && { category: { slug: categorySlug } }),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        flyerUrl: true,
        modality: true,
        startDate: true,
        duration: true,
        category: { select: categorySelect },
      },
      // El orden lo define el admin (drag-and-drop); `startDate` solo desempata.
      orderBy: [{ displayOrder: 'asc' }, { startDate: 'asc' }],
    });
  }

  async findBySlug(slug: string) {
    const program = await this.prisma.program.findUnique({
      where: { slug },
      include: {
        category: { select: categorySelect },
        modules: { orderBy: { order: 'asc' } },
        teachers: { orderBy: { order: 'asc' } },
      },
    });

    if (!program || !program.isPublished) {
      throw new NotFoundException('Programa no encontrado');
    }

    return program;
  }

  // ---- Admin ----

  findAllAdmin() {
    return this.prisma.program.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        flyerUrl: true,
        startDate: true,
        isPublished: true,
        updatedAt: true,
        category: { select: categorySelect },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOneAdmin(id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: {
        category: { select: categorySelect },
        modules: { orderBy: { order: 'asc' } },
        teachers: { orderBy: { order: 'asc' } },
      },
    });
    if (!program) {
      throw new NotFoundException('Programa no encontrado');
    }
    return program;
  }

  async create(dto: CreateProgramDto) {
    await this.ensureCategoryExists(dto.categoryId);
    const slug = await this.buildUniqueSlug(dto.slug ?? slugify(dto.title));
    const { modules, teachers, categoryId, ...scalars } = dto;

    // El nuevo programa se agrega al final de la lista (mayor displayOrder + 1).
    const last = await this.prisma.program.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    const displayOrder = (last?.displayOrder ?? -1) + 1;

    return this.prisma.program.create({
      data: {
        ...scalars,
        slug,
        displayOrder,
        category: { connect: { id: categoryId } },
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        enrollmentFee:
          dto.enrollmentFee != null
            ? new Prisma.Decimal(dto.enrollmentFee)
            : null,
        totalCost:
          dto.totalCost != null ? new Prisma.Decimal(dto.totalCost) : null,
        installmentFirstAmount:
          dto.installmentFirstAmount != null
            ? new Prisma.Decimal(dto.installmentFirstAmount)
            : null,
        installmentAmount:
          dto.installmentAmount != null
            ? new Prisma.Decimal(dto.installmentAmount)
            : null,
        installmentEnrollmentFee:
          dto.installmentEnrollmentFee != null
            ? new Prisma.Decimal(dto.installmentEnrollmentFee)
            : null,
        modules: { create: modules },
        teachers: { create: teachers },
      },
      include: {
        category: { select: categorySelect },
        modules: { orderBy: { order: 'asc' } },
        teachers: { orderBy: { order: 'asc' } },
      },
    });
  }

  async update(id: string, dto: UpdateProgramDto) {
    await this.findOneAdmin(id);

    const {
      modules,
      teachers,
      slug,
      enrollmentFee,
      totalCost,
      installmentFirstAmount,
      installmentAmount,
      installmentEnrollmentFee,
      startDate,
      categoryId,
      ...rest
    } = dto;

    const data: Prisma.ProgramUpdateInput = { ...rest };
    if (categoryId !== undefined) {
      await this.ensureCategoryExists(categoryId);
      data.category = { connect: { id: categoryId } };
    }
    if (slug !== undefined) {
      data.slug = await this.buildUniqueSlug(slug, id);
    }
    if (startDate !== undefined) {
      data.startDate = startDate ? new Date(startDate) : null;
    }
    if (enrollmentFee !== undefined) {
      data.enrollmentFee =
        enrollmentFee != null ? new Prisma.Decimal(enrollmentFee) : null;
    }
    if (totalCost !== undefined) {
      data.totalCost = totalCost != null ? new Prisma.Decimal(totalCost) : null;
    }
    if (installmentFirstAmount !== undefined) {
      data.installmentFirstAmount =
        installmentFirstAmount != null
          ? new Prisma.Decimal(installmentFirstAmount)
          : null;
    }
    if (installmentAmount !== undefined) {
      data.installmentAmount =
        installmentAmount != null
          ? new Prisma.Decimal(installmentAmount)
          : null;
    }
    if (installmentEnrollmentFee !== undefined) {
      data.installmentEnrollmentFee =
        installmentEnrollmentFee != null
          ? new Prisma.Decimal(installmentEnrollmentFee)
          : null;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.program.update({ where: { id }, data });

      if (modules !== undefined) {
        await tx.programModule.deleteMany({ where: { programId: id } });
        if (modules.length > 0) {
          await tx.programModule.createMany({
            data: modules.map((m) => ({ ...m, programId: id })),
          });
        }
      }

      if (teachers !== undefined) {
        await tx.programTeacher.deleteMany({ where: { programId: id } });
        if (teachers.length > 0) {
          await tx.programTeacher.createMany({
            data: teachers.map((t) => ({
              fullName: t.fullName,
              credentials: t.credentials ?? null,
              bio: t.bio ?? null,
              photoUrl: t.photoUrl ?? null,
              order: t.order,
              programId: id,
            })),
          });
        }
      }
    });

    return this.findOneAdmin(id);
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.program.delete({ where: { id } });
    return { success: true };
  }

  /** Reordena los programas según `orderedIds` (drag-and-drop del panel). */
  async reorder(dto: ReorderProgramsDto) {
    const current = await this.prisma.program.findMany({
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
        this.prisma.program.update({
          where: { id },
          data: { displayOrder: i + 1 },
        }),
      ),
    );
    return { success: true };
  }

  private async ensureCategoryExists(categoryId: string) {
    const category = await this.prisma.programCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException('Categoría no válida');
    }
  }

  private async buildUniqueSlug(base: string, excludeId?: string) {
    const root = slugify(base);
    if (!root) {
      throw new ConflictException('No se pudo generar un slug válido');
    }

    let candidate = root;
    let suffix = 2;
    // Reintenta con sufijo numérico mientras el slug esté en uso por otro programa.
    while (true) {
      const existing = await this.prisma.program.findUnique({
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
