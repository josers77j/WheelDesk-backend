import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from '../services/purchase-orders.service';
import { PurchaseOrderRepository } from '../repositories/purchase-order.repository';
import { PrismaService } from './../../../prisma/prisma.service';
import { ProvidersService } from './../../providers/services/providers.service';
import { ProductsService } from './../../products/services/products.service';
import { ProvidersRepository } from './../../providers/repositories/providers.repository';
import { ProductsRepository } from './../../products/repositories/products.repository';

describe('PurchaseOrdersController', () => {
  let controller: PurchaseOrdersController;

  const mockRepository = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseOrdersController],
      providers: [
        PurchaseOrdersService,
        { provide: PurchaseOrderRepository, useValue: mockRepository },
        { provide: PrismaService, useValue: mockRepository },
        { provide: ProvidersService, useValue: mockRepository },
        { provide: ProductsService, useValue: mockRepository },
        { provide: ProvidersRepository, useValue: mockRepository },
        { provide: ProductsRepository, useValue: mockRepository },
      ],
    }).compile();

    controller = module.get<PurchaseOrdersController>(PurchaseOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
