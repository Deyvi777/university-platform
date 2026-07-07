import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CLEANUP_QUEUE, CleanupService, PURGE_JOB } from './cleanup.service';

@Processor(CLEANUP_QUEUE)
export class CleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(private readonly cleanup: CleanupService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === PURGE_JOB) {
      await this.cleanup.purgeOldRows();
    } else {
      this.logger.warn(`Job de limpieza desconocido: ${job.name}`);
    }
  }
}
