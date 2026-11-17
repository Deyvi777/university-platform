import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { StorageService } from '../storage/storage.service';
import { streamStoredFile } from '../storage/stream-stored-file';
import { CallsService } from './calls.service';
import { CreateCallDto, UpdateCallDto } from './dto/call.dto';

@ApiTags('admin-calls')
@ApiBearerAuth()
@Controller('admin/calls')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminCallsController {
  constructor(
    private readonly service: CallsService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAllAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOneAdmin(id);
  }

  @Get(':id/applications')
  applications(@Param('id') id: string) {
    return this.service.listApplications(id);
  }

  @Delete(':id/applications/:applicationId')
  removeApplication(
    @Param('id') id: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.service.removeApplication(id, applicationId);
  }

  @Get('files/:filename')
  async downloadFile(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return streamStoredFile(
      this.storage,
      `call-applications/${filename}`,
      response,
    );
  }

  @Post()
  create(@Body() dto: CreateCallDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCallDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
