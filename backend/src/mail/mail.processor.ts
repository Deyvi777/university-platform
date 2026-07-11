import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { NotificationType, Role } from '@prisma/client';
import { Job } from 'bullmq';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CREDENTIALS_JOB,
  CredentialsMailPayload,
  ENROLLMENT_NOTICE_JOB,
  EnrollmentNoticeMailPayload,
  MAIL_QUEUE,
  MailService,
} from './mail.service';

type MailJob = Job<CredentialsMailPayload | EnrollmentNoticeMailPayload>;

/**
 * Procesa la cola `mail` fuera de la petición HTTP (con reintentos y
 * concurrencia limitada, para no saturar el SMTP en la carga masiva).
 */
@Processor(MAIL_QUEUE, { concurrency: 5 })
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly mail: MailService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: MailJob): Promise<void> {
    if (job.name === CREDENTIALS_JOB) {
      await this.mail.sendCredentials(job.data as CredentialsMailPayload);
    } else if (job.name === ENROLLMENT_NOTICE_JOB) {
      await this.mail.sendEnrollmentNotice(
        job.data as EnrollmentNoticeMailPayload,
      );
    } else {
      this.logger.warn(`Job de correo desconocido: ${job.name}`);
    }
  }

  /**
   * Aviso al ADMIN cuando un correo de credenciales agota sus reintentos
   * (cupo diario de SMTP excedido, servidor caído, rechazo inmediato, etc.).
   * Solo cubre fallos de **envío**: si el buzón destino no existe, el proveedor
   * suele aceptar el mensaje y el rebote llega después al buzón remitente —
   * eso no pasa por aquí. El aviso lleva las credenciales en `data` para que
   * el ADMIN pueda reenviarlas por WhatsApp desde la propia notificación.
   */
  @OnWorkerEvent('failed')
  async onFailed(job: MailJob | undefined, error: Error) {
    if (!job) return;
    // Aún quedan reintentos: BullMQ lo reintentará con backoff, no avisamos.
    if (job.attemptsMade < (job.opts.attempts ?? 1)) return;

    // El aviso de solicitud solo se registra: la solicitud ya quedó guardada y
    // notificada en la campana del panel (no hay credenciales que reponer).
    if (job.name === ENROLLMENT_NOTICE_JOB) {
      const n = job.data as EnrollmentNoticeMailPayload;
      this.logger.error(
        `El aviso por correo de la solicitud de ${n.email} agotó sus reintentos: ${
          error?.message || 'Error desconocido'
        }`,
      );
      return;
    }
    if (job.name !== CREDENTIALS_JOB) return;

    const p = job.data as CredentialsMailPayload;
    const reason = error?.message || 'Error desconocido';
    this.logger.error(
      `Correo de credenciales agotó sus reintentos para ${p.email}: ${reason}`,
    );
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: Role.ADMIN, isActive: true },
        select: { id: true },
      });
      if (admins.length === 0) return;

      // Convención institucional: "Apellido Nombre".
      const fullName =
        [p.lastName, p.firstName].filter(Boolean).join(' ') || p.email;
      const canWhatsApp = Boolean(p.phone);
      // Sin transacción: `createMany` empuja cada aviso por WebSocket al vuelo.
      await this.notifications.createMany(
        admins.map(({ id }) => ({
          userId: id,
          type: NotificationType.MAIL_FAILED,
          title: 'Falló el correo de credenciales',
          body:
            `No se pudo enviar el correo con las credenciales de acceso a **${fullName}** (${p.email}). ` +
            `Motivo: ${reason}.` +
            (canWhatsApp
              ? ' Puedes hacérselas llegar por WhatsApp con el botón de esta notificación.'
              : ''),
          data: {
            mailFailed: true,
            email: p.email,
            password: p.password,
            phone: p.phone ?? null,
            firstName: p.firstName,
            lastName: p.lastName ?? null,
            loginUrl: this.mail.loginUrl(),
          },
        })),
      );
    } catch (e) {
      // Nunca relanzar: un fallo al avisar no debe tumbar el worker.
      this.logger.error(
        `No se pudo notificar el fallo del correo para ${p.email}: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }
}
