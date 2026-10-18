import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { ZoneController } from './controllers/zone.controller';
import { ZoneService } from './services/zone.service';
import { ZoneRepository } from './repositories/zone.repository';

@Module({
  controllers: [ZoneController],
  providers: [ZoneService, ZoneRepository],
  imports: [PrismaModule],
})
export class ZoneModule {}
