import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditActionInterceptor } from './interceptors/audit-action.interceptor';
import { Module } from '@nestjs/common';
import { AuditController } from './controllers/audit.controller';
import { AuditService } from './services/audit.service';
import { PrismaModule } from '@prisma/prisma.module';

@Module({
  controllers: [AuditController],
  providers: [
    AuditService,
    { provide: APP_INTERCEPTOR, useClass: AuditActionInterceptor },
  ],
  exports: [AuditService],
  imports: [PrismaModule],
})
export class AuditModule {}
