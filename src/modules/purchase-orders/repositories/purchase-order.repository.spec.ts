import { Test } from '@nestjs/testing';
import { PrismaService } from '@prisma/prisma.service';
import { PurchaseOrderRepository } from './purchase-order.repository';

describe('Purchase approval read', () => {
  it('waits for the order lock and loads only approval relations on the same transaction', async (): Promise<void> => {
    let releaseLock: (() => void) | undefined;
    const lock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    const queryRaw = jest.fn().mockReturnValue(lock);
    const findUniqueOrThrow = jest
      .fn()
      .mockResolvedValue({ id: 7, status: 'PENDING', details: [] });
    const module = await Test.createTestingModule({
      providers: [
        PurchaseOrderRepository,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: queryRaw,
            purchaseOrder: { findUniqueOrThrow },
          },
        },
      ],
    }).compile();
    const transaction = module.get(PrismaService);
    const result = module
      .get(PurchaseOrderRepository)
      .findForApproval(7, transaction);
    expect(queryRaw).toHaveBeenCalledWith(
      ['SELECT id FROM "PurchaseOrder" WHERE id = ', ' FOR UPDATE'],
      7,
    );
    expect(findUniqueOrThrow).not.toHaveBeenCalled();
    if (!releaseLock) throw new Error('Lock was not initialized');
    releaseLock();
    await expect(result).resolves.toEqual({
      id: 7,
      status: 'PENDING',
      details: [],
    });
    expect(findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 7 },
      select: {
        id: true,
        status: true,
        details: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            productId: true,
            quantity: true,
            unitPrice: true,
            suggestedZoneId: true,
            product: { select: { id: true, name: true } },
          },
        },
      },
    });
    await module.close();
  });
});

describe('Purchase transition attribution', () => {
  it('records the approver/editor without replacing the creator', async (): Promise<void> => {
    const update = jest.fn().mockResolvedValue({ id: 7 });
    const module = await Test.createTestingModule({
      providers: [
        PurchaseOrderRepository,
        { provide: PrismaService, useValue: { purchaseOrder: { update } } },
      ],
    }).compile();
    const repository = module.get(PurchaseOrderRepository);
    const tx = module.get(PrismaService);
    await repository.approvePurchaseOrder(7, tx, 48);
    expect(update).toHaveBeenLastCalledWith({
      where: { id: 7 },
      data: { status: 'COMPLETED', updatedById: 48 },
    });
    await repository.rejectPurchaseOrder(7, 27);
    expect(update).toHaveBeenLastCalledWith({
      where: { id: 7 },
      data: { status: 'REJECTED', updatedById: 27 },
    });
    await module.close();
  });
});
