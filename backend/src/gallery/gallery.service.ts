import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  CreateGalleryItemDto,
  ReorderGalleryDto,
  UpdateGalleryItemDto,
} from './dto/gallery.dto';

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // ---- Público ----

  findAll() {
    return this.prisma.galleryItem.findMany({
      where: { isPublished: true },
      select: { id: true, type: true, url: true, title: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  // ---- Admin ----

  findAllAdmin() {
    return this.prisma.galleryItem.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOneAdmin(id: string) {
    const item = await this.prisma.galleryItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Elemento de galería no encontrado');
    }
    return item;
  }

  async create(dto: CreateGalleryItemDto) {
    // Se agrega al final de la lista.
    const last = await this.prisma.galleryItem.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    return this.prisma.galleryItem.create({
      data: { ...dto, displayOrder: (last?.displayOrder ?? 0) + 1 },
    });
  }

  /** Reordena la galería según `orderedIds` (drag-and-drop del panel). */
  async reorder(dto: ReorderGalleryDto) {
    const current = await this.prisma.galleryItem.findMany({
      orderBy: { displayOrder: 'asc' },
      select: { id: true },
    });
    const currentSet = new Set(current.map((i) => i.id));
    const provided = dto.orderedIds.filter((id) => currentSet.has(id));
    const providedSet = new Set(provided);
    const rest = current.map((i) => i.id).filter((id) => !providedSet.has(id));
    const finalOrder = [...provided, ...rest];

    await this.prisma.$transaction(
      finalOrder.map((id, i) =>
        this.prisma.galleryItem.update({
          where: { id },
          data: { displayOrder: i + 1 },
        }),
      ),
    );
    return { success: true };
  }

  async update(id: string, dto: UpdateGalleryItemDto) {
    const existing = await this.findOneAdmin(id);
    const updated = await this.prisma.galleryItem.update({
      where: { id },
      data: dto,
    });
    // Si se reemplazó el archivo, limpiar el blob anterior (best-effort).
    if (dto.url && dto.url !== existing.url) {
      await this.storage.deleteByUrls([existing.url]);
    }
    return updated;
  }

  async remove(id: string) {
    const existing = await this.findOneAdmin(id);
    await this.prisma.galleryItem.delete({ where: { id } });
    // El blob se limpia después del delete en BD (best-effort, nunca lanza).
    await this.storage.deleteByUrls([existing.url]);
    return { success: true };
  }
}
