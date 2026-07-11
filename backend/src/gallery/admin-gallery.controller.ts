import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateGalleryItemDto,
  ReorderGalleryDto,
  UpdateGalleryItemDto,
} from './dto/gallery.dto';
import { GalleryService } from './gallery.service';

@ApiTags('admin-gallery')
@ApiBearerAuth()
@Controller('admin/gallery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminGalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  findAll() {
    return this.galleryService.findAllAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.galleryService.findOneAdmin(id);
  }

  @Post()
  create(@Body() dto: CreateGalleryItemDto) {
    return this.galleryService.create(dto);
  }

  @Put('reorder')
  reorder(@Body() dto: ReorderGalleryDto) {
    return this.galleryService.reorder(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGalleryItemDto) {
    return this.galleryService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }
}
