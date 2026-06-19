import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';
import { ProgramsService } from './programs.service';

@ApiTags('admin-programs')
@ApiBearerAuth()
@Controller('admin/programs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  findAll() {
    return this.programsService.findAllAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programsService.findOneAdmin(id);
  }

  @Post()
  create(@Body() dto: CreateProgramDto) {
    return this.programsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.programsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.programsService.remove(id);
  }
}
