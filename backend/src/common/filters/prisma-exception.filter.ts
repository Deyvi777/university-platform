import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    switch (exception.code) {
      case 'P2002': {
        const target = exception.meta?.target;
        const field = Array.isArray(target) ? target.join(', ') : 'valor';
        return super.catch(
          new ConflictException(`Ya existe un registro con ese ${field}`),
          host,
        );
      }
      case 'P2025':
        return super.catch(
          new NotFoundException('Registro no encontrado'),
          host,
        );
      default:
        return super.catch(exception, host);
    }
  }
}
