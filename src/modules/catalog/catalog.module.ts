import { Module } from '@nestjs/common';

import { CatalogController } from './controllers/catalog.controller';

import { PrismaModule } from '@prisma/prisma.module';
import { CatalogService } from './services/catalog.service';
import { CatalogRepository } from './repositories/catalog.repository';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, CatalogRepository],
  imports: [PrismaModule],
})
export class CatalogModule {}
