import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  type OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/auth.service';
import { ChatService } from './chat.service';
import { sendMessageSchema } from './dto/chat.dto';

function corsOrigin(): string | string[] {
  return process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((u) => u.trim())
    : 'http://localhost:3000';
}

interface SocketData {
  userId: string;
  role: Role;
}

/**
 * Gateway WebSocket (socket.io) del chat docente ↔ estudiante. Namespace
 * `/chat`. Autentica la conexión con el mismo JWT del backend (enviado en
 * `handshake.auth.token`), confirma que el usuario esté activo y lo une a una
 * sala personal `user:<id>`. El envío persiste vía `ChatService` y reemite el
 * mensaje a las salas del emisor y del receptor en tiempo real.
 */
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: corsOrigin(), credentials: true },
})
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer() server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly chat: ChatService,
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
      // Fija la identidad del socket de forma SÍNCRONA (antes de cualquier
      // await) para que un `chat:send` enviado justo al conectar ya encuentre
      // `client.data` poblado — si no, hay una carrera con el await de la BD.
      (client.data as SocketData) = {
        userId: payload.sub,
        role: payload.role,
      };
      await client.join(`user:${payload.sub}`);
      // Confirma que el usuario exista y esté activo (el token puede sobrevivir
      // a una suspensión). Si no, se desconecta.
      await this.chat.getActiveUser(payload.sub);
    } catch {
      client.disconnect(true);
    }
  }

  // Envía un mensaje. Payload: { moduleId, toUserId, body }. Responde por ACK con
  // el mensaje persistido o un error, y reemite `chat:new` a ambos participantes.
  @SubscribeMessage('chat:send')
  async onSend(
    client: Socket,
    payload: { moduleId?: string; toUserId?: string; body?: string },
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const data = client.data as SocketData;
    if (!data?.userId) return { ok: false, error: 'No autenticado' };

    const parsed = sendMessageSchema.safeParse({ body: payload?.body });
    if (!parsed.success) {
      return { ok: false, error: 'Mensaje inválido' };
    }
    if (!payload?.moduleId || !payload?.toUserId) {
      return { ok: false, error: 'Conversación inválida' };
    }

    try {
      const { message, recipientId } = await this.chat.sendMessage(
        data.userId,
        data.role,
        payload.moduleId,
        payload.toUserId,
        parsed.data.body,
      );
      this.server
        .to(`user:${recipientId}`)
        .to(`user:${data.userId}`)
        .emit('chat:new', message);
      return { ok: true };
    } catch (err) {
      const error =
        err instanceof Error ? err.message : 'No se pudo enviar el mensaje';
      this.logger.warn(`chat:send falló: ${error}`);
      return { ok: false, error };
    }
  }
}
