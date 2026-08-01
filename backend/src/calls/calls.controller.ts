import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  ALLOWED_DOCUMENT_MIME,
  StorageService,
  type UploadedFileLike,
} from '../storage/storage.service';
import { CallsService } from './calls.service';
import { CreateCallApplicationDto } from './dto/call.dto';

@ApiTags('calls')
@Controller('calls')
export class CallsController {
  constructor(
    private readonly service: CallsService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAllPublic();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.service.findPublicBySlug(slug);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post(':slug/applications')
  createApplication(
    @Param('slug') slug: string,
    @Body() dto: CreateCallApplicationDto,
  ) {
    return this.service.createApplication(slug, dto);
  }

  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post('applications/upload/file')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (ALLOWED_DOCUMENT_MIME.includes(file.mimetype)) callback(null, true);
        else
          callback(
            new BadRequestException('Tipo de archivo no permitido'),
            false,
          );
      },
    }),
  )
  upload(@UploadedFile() file: UploadedFileLike | undefined) {
    if (!file) throw new BadRequestException('Archivo requerido');
    return this.storage.uploadDocument(file, 'call-applications');
  }
}
