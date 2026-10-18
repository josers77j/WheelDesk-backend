import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { UserRepository } from './repositories/users.repository';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { LoginProtectionModule } from '../auth/login-protection.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  imports: [PrismaModule, LoginProtectionModule],
  exports: [UsersService],
})
export class UsersModule {}
