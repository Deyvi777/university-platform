import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { StorageModule } from '../storage/storage.module';
import { AdminUsersController } from './admin-users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [StorageModule, MailModule],
  controllers: [AdminUsersController],
  providers: [UsersService],
  // Exportado para que otros módulos reutilicen el alta (p. ej. la conversión
  // de una solicitud de inscripción en cuenta STUDENT).
  exports: [UsersService],
})
export class UsersModule {}
