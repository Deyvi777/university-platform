import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { EnrollmentRequestsService } from './enrollment-requests.service';

@ApiTags('admin-enrollment-requests')
@ApiBearerAuth()
@Controller('admin/enrollment-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminEnrollmentRequestsController {
  constructor(private readonly service: EnrollmentRequestsService) {}

  @Get()
  findAll() {
    return this.service.findAllAdmin();
  }

  /** Crea la cuenta STUDENT con los datos de la solicitud (contraseña
   * autogenerada + correo de credenciales, igual que el alta manual). */
  @Post(':id/enroll')
  enroll(@Param('id') id: string) {
    return this.service.enroll(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
