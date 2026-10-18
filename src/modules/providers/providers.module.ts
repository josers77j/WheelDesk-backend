import { Module } from '@nestjs/common';
import { ProvidersController } from './controllers/providers.controller';
import { ProvidersService } from './services/providers.service';
import { ProvidersRepository } from './repositories/providers.repository';
import { PrismaModule } from '@prisma/prisma.module';

@Module({
  controllers: [ProvidersController],
  providers: [ProvidersService, ProvidersRepository],
  imports: [PrismaModule],
  exports: [ProvidersService],
})
export class ProvidersModule {}
