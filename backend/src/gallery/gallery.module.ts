import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { AdminGalleryController } from './admin-gallery.controller';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

@Module({
  imports: [StorageModule],
  controllers: [GalleryController, AdminGalleryController],
  providers: [GalleryService],
})
export class GalleryModule {}
