import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/settings.dto';

const SINGLETON_ID = 'singleton';

const socialSelect = {
  facebook: true,
  instagram: true,
  linkedin: true,
  youtube: true,
  tiktok: true,
  whatsapp: true,
} as const;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Público ----

  async findPublic() {
    const settings = await this.prisma.siteSettings.findUnique({
      where: { id: SINGLETON_ID },
      select: socialSelect,
    });
    return (
      settings ?? {
        facebook: null,
        instagram: null,
        linkedin: null,
        youtube: null,
        tiktok: null,
        whatsapp: null,
      }
    );
  }

  // ---- Admin ----

  findAdmin() {
    // Garantiza que la fila única exista para el panel.
    return this.prisma.siteSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID },
      update: {},
    });
  }

  update(dto: UpdateSettingsDto) {
    return this.prisma.siteSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...dto },
      update: dto,
    });
  }
}
