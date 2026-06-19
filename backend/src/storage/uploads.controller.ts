import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UploadQueryDto } from './dto/upload-query.dto';
import {
  ALLOWED_IMAGE_MIME,
  StorageService,
  type UploadedFileLike,
} from './storage.service';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de imagen no permitido'), false);
        }
      },
    }),
  )
  upload(
    @UploadedFile() file: UploadedFileLike | undefined,
    @Query() query: UploadQueryDto,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    return this.storage.uploadImage(file, query.folder);
  }
}
