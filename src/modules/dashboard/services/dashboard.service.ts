import {
  documentPeriod,
  DocumentPeriod,
} from '../../sale-orders/utils/document-period.util';
import { reportRange } from '../../sale-orders/utils/report-range.util';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { DashboardQueryDto } from '../dto/dashboard-query.dto';
import {
  eachDayKey,
  svDayKey,
  svEndOfDay,
  svStartOfDay,
} from '../utils/dashboard-date.util';

const DEFAULT_LOW_STOCK_MIN = 5;

const toNum = (v: unknown): number => Number(v ?? 0);

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  period(): Promise<DocumentPeriod> {
    return documentPeriod(this.prisma);
  }

  async getSummary(query: DashboardQueryDto) {
    const {
      fromKey,
      toKey,
      fromDate: from,
      toDate: to,
    } = reportRange(query.from, query.to);
    const lowStockMin = query.lowStockMin ?? DEFAULT_LOW_STOCK_MIN;

    const periodDays = eachDayKey(fromKey, toKey);
    const prevToKey = svDayKey(new Date(svStartOfDay(fromKey).getTime() - 1));
    const prevFromKey = svDayKey(
      new Date(
        svStartOfDay(prevToKey).getTime() -
          (periodDays.length - 1) * 86_400_000,
      ),
    );

    const [orders, prevIncome, lowStock] = await Promise.all([
      this.prisma.saleOrder.findMany({
        where: {
          createdAt: { gte: from, lte: to },
          status: { in: ['COMPLETED', 'CONTINGENCY'] },
        },
        include: {
          details: {
            include: { product: { select: { purchasePrice: true } } },
          },
        },
      }),
      this.getIncome(prevFromKey, prevToKey),
      this.prisma.product.findMany({
        // Servicios fuera: no tienen stock real.
        where: {
          deletedAt: null,
          stock: { lte: lowStockMin },
          type: { not: 'SERVICE' },
        },
        select: { id: true, name: true, stock: true },
        orderBy: { stock: 'asc' },
        take: 10,
      }),
    ]);

    const income = orders.reduce((acc, o) => acc + toNum(o.total), 0);
    const profit = orders.reduce(
      (acc, o) =>
        acc +
        o.details.reduce(
          (line, d) =>
            line +
            toNum(d.amountAfterDiscount) -
            toNum(d.product.purchasePrice) * d.quantity,
          0,
        ) -
        toNum(o.globalDiscount),
      0,
    );

    const salesByDay = this.buildDailySeries(fromKey, toKey, orders);
    const rankedProducts = this.rankProducts(orders);
    const topProducts = rankedProducts.slice(0, 10);
    const bottomProducts = rankedProducts.slice(-10).reverse();

    return {
      kpis: {
        salesTotal: orders.length,
        income,
        profit,
        documents: orders.length,
        ticketAvg: orders.length ? income / orders.length : 0,
        prevIncome,
      },
      salesByDay,
      topProducts,
      bottomProducts,
      lowStock: lowStock.map((p) => ({
        productId: String(p.id),
        name: p.name,
        stock: p.stock,
        min: lowStockMin,
      })),
    };
  }

  private async getIncome(fromKey: string, toKey: string): Promise<number> {
    const agg = await this.prisma.saleOrder.aggregate({
      where: {
        createdAt: { gte: svStartOfDay(fromKey), lte: svEndOfDay(toKey) },
        status: { in: ['COMPLETED', 'CONTINGENCY'] },
      },
      _sum: { total: true },
    });
    return toNum(agg._sum.total);
  }

  private buildDailySeries(
    fromKey: string,
    toKey: string,
    orders: { total: unknown; createdAt: Date }[],
  ) {
    const totals = new Map<string, number>();
    for (const o of orders) {
      const key = svDayKey(o.createdAt);
      totals.set(key, (totals.get(key) ?? 0) + toNum(o.total));
    }
    return eachDayKey(fromKey, toKey).map((date) => ({
      date,
      total: totals.get(date) ?? 0,
    }));
  }

  private rankProducts(
    orders: {
      details: {
        productId: number;
        productName: string;
        quantity: number;
        amountAfterDiscount: unknown;
      }[];
    }[],
  ) {
    const byProduct = new Map<
      number,
      { name: string; qty: number; total: number }
    >();
    for (const order of orders) {
      for (const d of order.details) {
        const current = byProduct.get(d.productId) ?? {
          name: d.productName,
          qty: 0,
          total: 0,
        };
        current.qty += d.quantity;
        current.total += toNum(d.amountAfterDiscount);
        byProduct.set(d.productId, current);
      }
    }
    return [...byProduct.entries()]
      .map(([productId, v]) => ({ productId: String(productId), ...v }))
      .sort((a, b) => b.total - a.total);
  }
}
