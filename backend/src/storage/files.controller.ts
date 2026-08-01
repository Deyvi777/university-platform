import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StorageService } from './storage.service';

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
  ): Promise<StreamableFile> {
    // Los documentos de postulaciones pueden contener datos personales y solo
    // se descargan por el endpoint protegido del módulo de convocatorias.
    if (folder === 'call-applications') {
      throw new NotFoundException('Archivo no encontrado');
    }
    const { stream, contentType } = await this.storage.getObject(
      `${folder}/${filename}`,
    );
    return new StreamableFile(stream, { type: contentType });
  }
}
