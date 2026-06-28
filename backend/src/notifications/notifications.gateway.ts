import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  type OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

function corsOrigin(): string | string[] {
  return process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((u) => u.trim())
    : 'http://localhost:3000';
}

/**
 * Gateway WebSocket (socket.io) del centro de notificaciones. Namespace
 * `/notifications`. Autentica con el JWT del backend (en `handshake.auth.token`),
 * une al usuario a su sala personal `user:<id>` y, cuando se crean
 * notificaciones, `NotificationsService` empuja un `notification:new` a esa sala
 * — reemplazando el polling cada 5 s. No expone mensajes entrantes: solo recibe
 * pushes del servidor.
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: corsOrigin(), credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const raw =
        (client.handshake.auth?.token as string | undefined) ??
        client.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (!raw) throw new Error('Sin token');

      const payload = this.jwt.verify<JwtPayload>(raw, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      // Une a la sala personal de forma síncrona (antes de cualquier await) y
      // luego verifica que el usuario siga activo; si no, desconecta.
      await client.join(`user:${payload.sub}`);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { isActive: true },
      });
      if (!user || !user.isActive) throw new Error('Usuario inactivo');
    } catch {
      client.disconnect(true);
    }
  }

  /** Empuja un evento a la sala personal de un usuario (si el server ya está listo). */
  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }
}
