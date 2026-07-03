import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

// PrismaModule es @Global, así que no hace falta importarlo aquí.
@Module({
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
