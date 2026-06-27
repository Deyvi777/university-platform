import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateTeamMemberDto,
  ReorderTeamDto,
  UpdateTeamMemberDto,
} from './dto/team-member.dto';
import { TeamService } from './team.service';

@ApiTags('admin-team')
@ApiBearerAuth()
@Controller('admin/team')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminTeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  findAll() {
    return this.teamService.findAllAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamService.findOneAdmin(id);
  }

  @Post()
  create(@Body() dto: CreateTeamMemberDto) {
    return this.teamService.create(dto);
  }

  @Put('reorder')
  reorder(@Body() dto: ReorderTeamDto) {
    return this.teamService.reorder(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    return this.teamService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamService.remove(id);
  }
}
