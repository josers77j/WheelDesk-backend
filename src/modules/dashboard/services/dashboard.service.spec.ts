import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('counts sales by sale orders instead of detail units', async () => {
    const prisma = {
      saleOrder: {
        findMany: jest.fn().mockResolvedValue([
          {
            total: 30,
            globalDiscount: 0,
            createdAt: new Date('2026-10-01T12:00:00Z'),
            details: [
              {
                productId: 1,
                productName: 'Product 1',
                quantity: 3,
                amountAfterDiscount: 30,
                product: { purchasePrice: 5 },
              },
            ],
          },
          {
            total: 20,
            globalDiscount: 0,
            createdAt: new Date('2026-10-01T13:00:00Z'),
            details: [
              {
                productId: 2,
                productName: 'Product 2',
                quantity: 2,
                amountAfterDiscount: 20,
                product: { purchasePrice: 8 },
              },
            ],
          },
        ]),
        aggregate: jest.fn().mockResolvedValue({ _sum: { total: 0 } }),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const service = new DashboardService(prisma as never);

    const summary = await service.getSummary({
      from: '2026-10-01',
      to: '2026-10-01',
    });

    expect(summary.kpis.salesTotal).toBe(2);
  });
});
