import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { WarehouseController } from './controllers/warehouse.controller';
import { WarehouseService } from './services/warehouse.service';
import { WarehouseRepository } from './repositories/warehouse.repository';

@Module({
  controllers: [WarehouseController],
  providers: [WarehouseService, WarehouseRepository],
  imports: [PrismaModule],
})
export class WarehouseModule {}
