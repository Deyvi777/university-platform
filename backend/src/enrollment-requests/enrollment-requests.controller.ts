import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { CreateEnrollmentRequestDto } from './dto/enrollment-request.dto';
import { EnrollmentRequestsService } from './enrollment-requests.service';

/** Endpoint público: recibe el formulario de inscripción de la landing. */
@ApiTags('enrollment-requests')
@Controller('enrollment-requests')
export class EnrollmentRequestsController {
  constructor(private readonly service: EnrollmentRequestsService) {}

  // Más estricto que el throttle global (100/min): es un formulario público.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  create(@Body() dto: CreateEnrollmentRequestDto) {
    return this.service.create(dto);
  }
}
