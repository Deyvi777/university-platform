import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { BulkUsersDto } from './dto/bulk-user.dto';
import { UsersService } from './users.service';

@ApiTags('admin-users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query('role') role?: string) {
    return this.usersService.findAllAdmin(role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOneAdmin(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /** Carga masiva de estudiantes desde la plantilla Excel (carga parcial). */
  @Post('bulk')
  bulkCreate(@Body() dto: BulkUsersDto) {
    return this.usersService.bulkCreateStudents(dto.students);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
