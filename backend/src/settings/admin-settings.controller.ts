import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateSettingsDto } from './dto/settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('admin-settings')
@ApiBearerAuth()
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  find() {
    return this.settingsService.findAdmin();
  }

  @Patch()
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
