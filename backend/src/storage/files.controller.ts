import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { StorageService } from './storage.service';
import { streamStoredFile } from './stream-stored-file';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  // Endpoint público: hace stream de los objetos almacenados en Garage.
  @Get(':folder/:filename')
  @Header('Cache-Control', 'public, max-age=86400')
  async serve(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    // Los documentos de postulaciones pueden contener datos personales y solo
    // se descargan por el endpoint protegido del módulo de convocatorias.
    if (folder === 'call-applications') {
      throw new NotFoundException('Archivo no encontrado');
    }
    return streamStoredFile(this.storage, `${folder}/${filename}`, response);
  }
}
