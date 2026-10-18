import { Test, TestingModule } from '@nestjs/testing';
import { BrandController } from './brand.controller';
import { BrandService } from '../services/brand.service';
import { BrandRepository } from '../repositories/brand.repository';

describe('BrandController', () => {
  let controller: BrandController;

  const mockBrandRepository = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandController],
      providers: [
        BrandService,
        { provide: BrandRepository, useValue: mockBrandRepository },
      ],
    }).compile();

    controller = module.get<BrandController>(BrandController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
