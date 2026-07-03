import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  CREDENTIALS_JOB,
  CredentialsMailPayload,
  MAIL_QUEUE,
  MailService,
} from './mail.service';

/**
 * Procesa la cola `mail` fuera de la petición HTTP (con reintentos y
 * concurrencia limitada, para no saturar el SMTP en la carga masiva).
 */
@Processor(MAIL_QUEUE, { concurrency: 5 })
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mail: MailService) {
    super();
  }

  async process(job: Job<CredentialsMailPayload>): Promise<void> {
    if (job.name === CREDENTIALS_JOB) {
      await this.mail.sendCredentials(job.data);
    } else {
      this.logger.warn(`Job de correo desconocido: ${job.name}`);
    }
  }
}
