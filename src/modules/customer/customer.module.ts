import { Module } from '@nestjs/common';

import { PrismaModule } from '@prisma/prisma.module';
import { CustomerController } from './controllers/customer.controller';
import { CustomerService } from './services/customer.service';
import { CustomerRepository } from './repositories/customer.repository';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService, CustomerRepository],
  imports: [PrismaModule],
  exports: [CustomerService],
})
export class CustomerModule {}
