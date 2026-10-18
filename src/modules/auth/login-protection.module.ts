import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LoginProtectionService } from './services/login-protection.service';

@Module({
  imports: [PrismaModule],
  providers: [LoginProtectionService],
  exports: [LoginProtectionService],
})
export class LoginProtectionModule {}
