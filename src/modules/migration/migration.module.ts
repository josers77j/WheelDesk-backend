import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MigrationController } from './controllers/migration.controller';
import { MigrationService } from './services/migration.service';
import { MigrationImportService } from './services/migration-import.service';
import { PrismaModule } from '@prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { MigrationUnlockService } from './services/migration-unlock.service';
import { MigrationUnlockGuard } from './guards/migration-unlock.guard';

@Module({
  controllers: [MigrationController],
  providers: [
    MigrationService,
    MigrationImportService,
    MigrationUnlockService,
    MigrationUnlockGuard,
  ],
  imports: [
    PrismaModule,
    StorageModule,
    AuditModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
    }),
  ],
})
export class MigrationModule {}
