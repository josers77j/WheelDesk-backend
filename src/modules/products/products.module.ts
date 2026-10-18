import { Module } from '@nestjs/common';

import { PrismaModule } from '@prisma/prisma.module';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { ProductsRepository } from './repositories/products.repository';
import { StorageModule } from '../storage/storage.module';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  imports: [PrismaModule, StorageModule],
  exports: [ProductsService],
})
export class ProductsModule {}
