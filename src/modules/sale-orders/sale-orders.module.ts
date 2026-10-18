import { AccountingReportsController } from './controllers/accounting-reports.controller';
import { AccountingReportsService } from './services/accounting-reports.service';
import { Module } from '@nestjs/common';
import { SaleOrdersController } from './controllers/sale-orders.controller';
import { SaleOrdersService } from './services/sale-orders.service';
import { SaleOrderRepository } from './repositories/sale-orders.repository';
import { PrismaModule } from '@prisma/prisma.module';
import { CustomerModule } from '../customer/customer.module';
import { ProductsModule } from '../products/products.module';
import { SaleDocumentsService } from './services/sale-documents.service';
import { SaleCheckoutService } from './services/sale-checkout.service';
import { SaleDeliveryService } from './services/sale-delivery.service';
import { AuditModule } from '../audit/audit.module';
import { StorageModule } from '../storage/storage.module';
import { MailModule } from '../mail/mail.module';

@Module({
  controllers: [SaleOrdersController, AccountingReportsController],
  providers: [
    SaleOrdersService,
    AccountingReportsService,
    SaleOrderRepository,
    SaleDocumentsService,
    SaleCheckoutService,
    SaleDeliveryService,
  ],
  exports: [SaleOrderRepository],
  imports: [
    PrismaModule,
    CustomerModule,
    ProductsModule,
    AuditModule,
    StorageModule,
    MailModule,
  ],
})
export class SaleOrdersModule {}
