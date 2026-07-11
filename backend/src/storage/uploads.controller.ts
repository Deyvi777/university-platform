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
  ALLOWED_VIDEO_MIME,
  StorageService,
  type UploadedFileLike,
} from './storage.service';

/** Límite del video promocional del programa (admin). */
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

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

  // Video promocional de un programa (MP4/WebM/OGG/MOV, hasta 200 MB).
  @Post('video')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_VIDEO_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_VIDEO_MIME.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de video no permitido'), false);
        }
      },
    }),
  )
  uploadVideo(@UploadedFile() file: UploadedFileLike | undefined) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    return this.storage.uploadVideo(file, 'programs-videos');
  }
}
