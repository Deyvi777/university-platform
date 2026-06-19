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
import { CreatePartnerDto, UpdatePartnerDto } from './dto/partner.dto';
import { PartnersService } from './partners.service';

@ApiTags('admin-partners')
@ApiBearerAuth()
@Controller('admin/partners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminPartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  findAll() {
    return this.partnersService.findAllAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partnersService.findOneAdmin(id);
  }

  @Post()
  create(@Body() dto: CreatePartnerDto) {
    return this.partnersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.partnersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partnersService.remove(id);
  }
}
