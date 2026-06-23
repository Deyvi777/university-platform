import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { MeUploadsController } from './me-uploads.controller';
import { StorageService } from './storage.service';
import { UploadsController } from './uploads.controller';

@Module({
  controllers: [UploadsController, MeUploadsController, FilesController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
