import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { TransferController } from './controllers/transfer.controller';
import { TransferService } from './services/transfer.service';
import { TransferRepository } from './repositories/transfer.repository';
import { ProductsModule } from '../products/products.module';

@Module({
  controllers: [TransferController],
  providers: [TransferService, TransferRepository],
  imports: [PrismaModule, ProductsModule],
})
export class TransfersModule {}
