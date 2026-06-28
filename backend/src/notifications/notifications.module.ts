import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminNotificationsController } from './admin-notifications.controller';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

// Exporta el servicio para que otros módulos (p. ej. CoursesModule) puedan
// crear notificaciones al inscribir estudiantes o asignar docentes. El gateway
// WebSocket las empuja en tiempo real (sin polling).
@Module({
  imports: [
    // El gateway verifica el JWT del backend en el handshake del socket.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
