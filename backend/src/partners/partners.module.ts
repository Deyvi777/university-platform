import { Module } from '@nestjs/common';
import { AdminPartnersController } from './admin-partners.controller';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';

@Module({
  controllers: [PartnersController, AdminPartnersController],
  providers: [PartnersService],
})
export class PartnersModule {}
