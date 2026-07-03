import { Module } from '@nestjs/common';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';

// PrismaModule es @Global, así que no hace falta importarlo aquí.
@Module({
  controllers: [ForumController],
  providers: [ForumService],
})
export class ForumModule {}
