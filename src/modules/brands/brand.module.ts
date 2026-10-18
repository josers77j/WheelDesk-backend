import { Module } from '@nestjs/common';
import { BrandController } from './controllers/brand.controller';
import { BrandService } from './services/brand.service';
import { BrandRepository } from './repositories/brand.repository';
import { PrismaModule } from '@prisma/prisma.module';

@Module({
  controllers: [BrandController],
  providers: [BrandService, BrandRepository],
  imports: [PrismaModule],
})
export class BrandModule {}
