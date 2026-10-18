import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from '../services/products.service';
import { ProductsRepository } from '../repositories/products.repository';
import { PrismaService } from '@prisma/prisma.service';
import { StorageService } from '../../storage/services/storage.service';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockProductsRepository = {};
  const mockPrismaService = { $transaction: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: ProductsRepository, useValue: mockProductsRepository },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StorageService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
