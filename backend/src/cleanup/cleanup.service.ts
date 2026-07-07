import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

export const CLEANUP_QUEUE = 'cleanup';
export const PURGE_JOB = 'purge-old-rows';

/** Retención de mensajes de chat y notificaciones (1 año). */
const RETENTION_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Limpieza periódica de datos conversacionales para no engordar la base:
 * borra los `ChatMessage` y `Notification` con más de un año de antigüedad.
 * Solo texto/avisos históricos — nunca datos académicos (notas, entregas,
 * intentos de quiz) ni archivos.
 */
@Injectable()
export class CleanupService implements OnModuleInit {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CLEANUP_QUEUE) private readonly queue: Queue,
  ) {}

  /**
   * Programa el job repetible (04:00 UTC = medianoche en Bolivia). El
   * scheduler es un upsert por id: reiniciar el backend no lo duplica y
   * cambiar el cron aquí lo actualiza solo.
   */
  async onModuleInit() {
    try {
      await this.queue.upsertJobScheduler(
        PURGE_JOB,
        { pattern: '0 4 * * *' },
        { name: PURGE_JOB, opts: { removeOnComplete: 5, removeOnFail: 5 } },
      );
    } catch (e) {
      // Sin Redis el resto de la app debe seguir arrancando igual.
      this.logger.error(
        `No se pudo programar la limpieza periódica: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  /** Borra las filas más viejas que la retención. Devuelve los conteos. */
  async purgeOldRows() {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * DAY_MS);
    const [chat, notifications] = await Promise.all([
      this.prisma.chatMessage.deleteMany({
        where: { createdAt: { lt: cutoff } },
      }),
      this.prisma.notification.deleteMany({
        where: { createdAt: { lt: cutoff } },
      }),
    ]);
    if (chat.count > 0 || notifications.count > 0) {
      this.logger.log(
        `Limpieza (> ${RETENTION_DAYS} días): ${chat.count} mensajes de chat y ${notifications.count} notificaciones eliminados`,
      );
    }
    return { chat: chat.count, notifications: notifications.count };
  }
}
