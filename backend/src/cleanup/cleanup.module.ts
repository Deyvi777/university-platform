import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CleanupProcessor } from './cleanup.processor';
import { CLEANUP_QUEUE, CleanupService } from './cleanup.service';

@Module({
  imports: [BullModule.registerQueue({ name: CLEANUP_QUEUE })],
  providers: [CleanupService, CleanupProcessor],
})
export class CleanupModule {}
