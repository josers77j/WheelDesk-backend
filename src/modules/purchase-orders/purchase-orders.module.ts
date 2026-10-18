import { PurchaseDocumentsController } from './controllers/purchase-documents.controller';
import { PurchaseDocumentsService } from './services/purchase-documents.service';
import { MailModule } from '../mail/mail.module';
import { AssistedPurchaseController } from './controllers/assisted-purchase.controller';
import { AssistedPurchaseService } from './services/assisted-purchase.service';
import { StorageModule } from '../storage/storage.module';
import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './controllers/purchase-orders.controller';
import { PurchaseOrdersService } from './services/purchase-orders.service';
import { PurchaseOrderRepository } from './repositories/purchase-order.repository';
import { PrismaModule } from '@prisma/prisma.module';
import { ProvidersModule } from '../providers/providers.module';
import { ProductsModule } from '../products/products.module';

@Module({
  controllers: [
    PurchaseDocumentsController,
    AssistedPurchaseController,
    PurchaseOrdersController,
  ],
  providers: [
    PurchaseDocumentsService,
    AssistedPurchaseService,
    PurchaseOrdersService,
    PurchaseOrderRepository,
  ],
  imports: [
    MailModule,
    StorageModule,
    PrismaModule,
    ProvidersModule,
    ProductsModule,
  ],
})
export class PurchaseOrdersModule {}
