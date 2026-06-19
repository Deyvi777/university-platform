import { Module } from '@nestjs/common';
import { AdminSettingsController } from './admin-settings.controller';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsController, AdminSettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
