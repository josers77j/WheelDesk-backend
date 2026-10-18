import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import type { User } from '../../auth/interfaces/user.interface';
import type { CreateSaleOrderDto } from '../dto/create-sale-order.dto';
import type {
  CheckoutResponse,
  CheckoutResult,
} from '../interfaces/sale-order.interface';
import { SaleOrdersService } from './sale-orders.service';
import { SaleDocumentsService } from './sale-documents.service';
import { SaleDeliveryService } from './sale-delivery.service';
import { validateSaleDocumentPair } from '../utils/sale-document-pair.util';

@Injectable()
export class SaleCheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: SaleOrdersService,
    private readonly documents: SaleDocumentsService,
    private readonly delivery: SaleDeliveryService,
  ) {}

  async checkout(
    dto: CreateSaleOrderDto,
    user: User,
    files: Express.Multer.File[] = [],
  ): Promise<CheckoutResponse> {
    const pair = validateSaleDocumentPair(files);
    const previous = await this.prisma.saleOrder.findUnique({
      where: { requestId: dto.requestId },
      select: { id: true, status: true },
    });
    if (previous)
      return {
        requestId: dto.requestId,
        saleOrderId: previous.id,
        status: previous.status,
        finalized: true,
        emailStatus: 'not_requested',
        message: 'La venta ya estaba registrada.',
      };
    const document = pair ? await this.documents.storePair(pair) : undefined;
    let result: CheckoutResult;
    try {
      result = await this.orders.checkout(dto, user, document);
    } catch (error: unknown) {
      if (document) {
        const attached = await this.prisma.saleOrderDocument.findFirst({
          where: { jsonKey: document.jsonKey },
          select: { id: true },
        });
        if (!attached) await this.documents.discard(document);
      }
      throw error;
    }
    if ('isAlreadyProcessed' in result) {
      if (document) await this.documents.discard(document);
      if (!result.data)
        throw new Error('No se pudo recuperar la venta registrada.');
      return result.data;
    }
    if (!document) return result;
    const email = await this.delivery.send(result.saleOrderId);
    return {
      ...result,
      emailStatus: email.emailStatus,
      message: email.emailStatus === 'failed' ? email.message : result.message,
    };
  }
}
