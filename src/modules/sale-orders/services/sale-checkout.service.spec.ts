import { Test } from '@nestjs/testing';
import { PrismaService } from '@prisma/prisma.service';
import {
  OrderStatus,
  UserRole,
} from '../../../../prisma/generated/prisma/client';
import type { User } from '../../auth/interfaces/user.interface';

import { SaleCheckoutService } from './sale-checkout.service';
import { SaleOrdersService } from './sale-orders.service';
import { SaleDocumentsService } from './sale-documents.service';
import { SaleDeliveryService } from './sale-delivery.service';
import type { CheckoutResponse } from '../interfaces/sale-order.interface';
import { upload, checkoutDto } from '../../../../test/sale-test-fixtures';

const user: User = {
  id: 1,
  name: 'QA',
  email: 'test@example.com',
  role: UserRole.ADMIN,
};
const response: CheckoutResponse = {
  requestId: checkoutDto.requestId,
  saleOrderId: 42,
  status: OrderStatus.COMPLETED,
  finalized: true,
  emailStatus: 'not_requested',
  message: 'Venta creada correctamente',
};

describe('Sale checkout orchestration', (): void => {
  let service: SaleCheckoutService;
  const findUnique = jest.fn();
  const findFirst = jest.fn();
  const checkout = jest.fn();
  const storePair = jest.fn();
  const discard = jest.fn();
  const send = jest.fn();
  const document = {
    pdfKey: 'unique.pdf',
    jsonKey: 'unique.json',
    pdfFilename: 'a.pdf',
    jsonFilename: 'a.json',
  };
  const files = (): Express.Multer.File[] => [
    upload('a.pdf', '%PDF-1.7'),
    upload('a.json', '{}'),
  ];
  beforeEach(async (): Promise<void> => {
    jest.clearAllMocks();
    findUnique.mockResolvedValue(null);
    findFirst.mockResolvedValue(null);
    checkout.mockResolvedValue(response);
    storePair.mockResolvedValue(document);
    discard.mockResolvedValue(undefined);
    send.mockResolvedValue({ emailStatus: 'sent', message: 'Sent' });
    const module = await Test.createTestingModule({
      providers: [
        SaleCheckoutService,
        {
          provide: PrismaService,
          useValue: {
            saleOrder: { findUnique },
            saleOrderDocument: { findFirst },
          },
        },
        { provide: SaleOrdersService, useValue: { checkout } },
        { provide: SaleDocumentsService, useValue: { storePair, discard } },
        { provide: SaleDeliveryService, useValue: { send } },
      ],
    }).compile();
    service = module.get(SaleCheckoutService);
  });
  it('creates a sale without files or email', async (): Promise<void> => {
    expect(await service.checkout(checkoutDto, user)).toEqual(response);
    expect(storePair).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it('rejects a partial pair before upload or sale', async (): Promise<void> => {
    await expect(
      service.checkout(checkoutDto, user, [upload('a.pdf', '%PDF-1.7')]),
    ).rejects.toThrow();
    expect(storePair).not.toHaveBeenCalled();
    expect(checkout).not.toHaveBeenCalled();
  });
  it('returns a completed sale with a mail warning instead of rolling back', async (): Promise<void> => {
    send.mockResolvedValue({
      emailStatus: 'failed',
      message: 'Retry or contact support',
    });
    expect(await service.checkout(checkoutDto, user, files())).toMatchObject({
      saleOrderId: 42,
      finalized: true,
      emailStatus: 'failed',
    });
    expect(checkout).toHaveBeenCalledWith(checkoutDto, user, document);
    expect(discard).not.toHaveBeenCalled();
    expect(storePair.mock.invocationCallOrder[0]).toBeLessThan(
      checkout.mock.invocationCallOrder[0],
    );
    expect(checkout.mock.invocationCallOrder[0]).toBeLessThan(
      send.mock.invocationCallOrder[0],
    );
  });
  it('returns an existing sale without uploading or emailing it again', async (): Promise<void> => {
    findUnique.mockResolvedValue({ id: 42, status: OrderStatus.COMPLETED });
    expect(await service.checkout(checkoutDto, user, files())).toMatchObject({
      saleOrderId: 42,
      finalized: true,
    });
    expect(checkout).not.toHaveBeenCalled();
    expect(storePair).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it('discards only the unused upload when a concurrent request won', async (): Promise<void> => {
    const winning = {
      ...document,
      jsonKey: 'winning.json',
      pdfKey: 'winning.pdf',
    };
    const losing = {
      ...document,
      jsonKey: 'losing.json',
      pdfKey: 'losing.pdf',
    };
    storePair.mockResolvedValueOnce(winning).mockResolvedValueOnce(losing);
    checkout
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce({ isAlreadyProcessed: true, data: response });
    await Promise.all([
      service.checkout(checkoutDto, user, files()),
      service.checkout(checkoutDto, user, files()),
    ]);
    expect(send).toHaveBeenCalledTimes(1);
    expect(discard).toHaveBeenCalledTimes(1);
    expect(discard).toHaveBeenCalledWith(losing);
  });
  it('cleans up files when stock validation rolls the sale back', async (): Promise<void> => {
    checkout.mockRejectedValue(new Error('Insufficient stock'));
    await expect(service.checkout(checkoutDto, user, files())).rejects.toThrow(
      'Insufficient stock',
    );
    expect(discard).toHaveBeenCalledWith(document);
    expect(send).not.toHaveBeenCalled();
  });
});
