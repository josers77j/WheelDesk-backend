import { readUnknownField } from '../../../common/utils/type-guards.util';
import { Test } from '@nestjs/testing';
import {
  UserRole,
  OrderStatus,
} from '../../../../prisma/generated/prisma/client';
import { SaleOrdersController } from './sale-orders.controller';
import { SaleOrdersService } from '../services/sale-orders.service';
import { SaleCheckoutService } from '../services/sale-checkout.service';
import { SaleDocumentsService } from '../services/sale-documents.service';
import { SaleDeliveryService } from '../services/sale-delivery.service';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { checkoutDto } from '../../../../test/sale-test-fixtures';
import type { User } from '../../auth/interfaces/user.interface';

describe('Internal sale controller', (): void => {
  const checkout = jest.fn();
  const send = jest.fn();
  let controller: SaleOrdersController;
  const user: User = {
    id: 1,
    name: 'QA',
    role: UserRole.ADMIN,
    email: 'qa@example.com',
  };
  beforeEach(async (): Promise<void> => {
    jest.clearAllMocks();
    checkout.mockResolvedValue({
      saleOrderId: 42,
      status: OrderStatus.COMPLETED,
      finalized: true,
      emailStatus: 'not_requested',
    });
    const module = await Test.createTestingModule({
      controllers: [SaleOrdersController],
      providers: [
        { provide: SaleOrdersService, useValue: {} },
        { provide: SaleCheckoutService, useValue: { checkout } },
        { provide: SaleDocumentsService, useValue: {} },
        { provide: SaleDeliveryService, useValue: { send } },
      ],
    }).compile();
    controller = module.get(SaleOrdersController);
  });
  it('validates JSON checkout and delegates a final sale without files', async (): Promise<void> => {
    expect(await controller.checkout(checkoutDto, user)).toMatchObject({
      finalized: true,
      saleOrderId: 42,
    });
    expect(checkout).toHaveBeenCalledWith(
      expect.objectContaining(checkoutDto),
      user,
      [],
    );
  });
  it('accepts the same sale payload encoded as multipart JSON', async (): Promise<void> => {
    await controller.checkout({ payload: JSON.stringify(checkoutDto) }, user);
    expect(checkout).toHaveBeenCalledWith(
      expect.objectContaining(checkoutDto),
      user,
      [],
    );
  });
  it('rejects unexpected fields before invoking sale creation', async (): Promise<void> => {
    await expect(
      controller.checkout({ ...checkoutDto, forceAdmin: true }, user),
    ).rejects.toThrow();
    expect(checkout).not.toHaveBeenCalled();
  });
  it('requires ADMIN or SELLER for checkout and email delivery', (): void => {
    for (const handler of [
      readUnknownField(SaleOrdersController.prototype, 'checkout'),
      readUnknownField(SaleOrdersController.prototype, 'sendEmail'),
    ]) {
      if (typeof handler !== 'function')
        throw new Error('Expected a controller handler');
      expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
        UserRole.ADMIN,
        UserRole.SELLER,
      ]);
      expect(Reflect.getMetadata(ROLES_KEY, handler)).not.toContain(
        UserRole.VIEWER,
      );
    }
  });
});
