import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ALLOWED_DOCUMENT_MIME,
  StorageService,
  type UploadedFileLike,
} from './storage.service';

// Subida de archivos de docentes (materiales de sus módulos) y estudiantes
// (entregas de actividades): PDF, Office, imágenes, etc. Hasta 20 MB. La carpeta
// depende del rol (`materials` vs `submissions`). El archivo solo queda
// vinculado al crear el Material / la entrega (operaciones autorizadas).
@ApiTags('me-uploads')
@ApiBearerAuth()
@Controller('me/uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PROFESSOR, Role.STUDENT)
export class MeUploadsController {
  constructor(private readonly storage: StorageService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_DOCUMENT_MIME.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de archivo no permitido'), false);
        }
      },
    }),
  )
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedFileLike | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    const folder = user.role === Role.STUDENT ? 'submissions' : 'materials';
    return this.storage.uploadDocument(file, folder);
  }
}
