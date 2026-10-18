import { MailModule } from '../mail/mail.module';
import { QuotationDeliveryService } from './services/quotation-delivery.service';
import { Module } from '@nestjs/common';
import { QuotationsController } from './controllers/quotations.controller';
import { QuotationsService } from './services/quotations.service';
import { QuotationsRepository } from './repositories/quotations.repository';
import { PrismaModule } from '@prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { PrinterModule } from '../printer/printer.module';
import { QuotationDocumentsService } from './services/quotation-documents.service';

@Module({
  controllers: [QuotationsController],
  providers: [
    QuotationsService,
    QuotationsRepository,
    QuotationDocumentsService,
    QuotationDeliveryService,
  ],
  imports: [PrismaModule, ProductsModule, PrinterModule, MailModule],
})
export class QuotationsModule {}
