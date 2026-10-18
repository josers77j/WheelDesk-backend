import { Module } from '@nestjs/common';
import { LocationsService } from './services/locations.service';
import { LocationsController } from './controllers/locations.controller';

import { PrismaModule } from '@prisma/prisma.module';

@Module({
  controllers: [LocationsController],
  providers: [LocationsService],
  imports: [PrismaModule],
})
export class LocationsModule {}
