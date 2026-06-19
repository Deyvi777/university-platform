import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { StorageService } from './storage.service';
import { UploadsController } from './uploads.controller';

@Module({
  controllers: [UploadsController, FilesController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
