import 'reflect-metadata';
import { Readable } from 'node:stream';
import {
  CheckoutDocumentType,
  CreateSaleOrderDto,
} from '../src/modules/sale-orders/dto/create-sale-order.dto';
export function upload(name: string, content: string): Express.Multer.File {
  const buffer = Buffer.from(content);
  return {
    fieldname: 'files',
    originalname: name,
    encoding: '7bit',
    mimetype: 'application/octet-stream',
    size: buffer.length,
    buffer,
    stream: Readable.from(buffer),
    destination: '',
    filename: name,
    path: '',
  };
}

export const checkoutDto: CreateSaleOrderDto = {
  requestId: '11111111-1111-4111-8111-111111111111',
  documentType: CheckoutDocumentType.INVOICE,
  documentTypeId: 1,
  items: [{ productId: 1, productName: 'Tire', quantity: 1, zoneId: 1 }],
  paymentMethod: [{ amount: 10, paymentMethodId: 1, code: '01', name: 'Cash' }],
};
