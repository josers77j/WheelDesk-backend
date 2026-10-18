import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from '../services/providers.service';
import { ProvidersRepository } from '../repositories/providers.repository';

describe('ProvidersController', () => {
  let controller: ProvidersController;

  const mockProvidersRepository = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvidersController],
      providers: [
        ProvidersService,
        { provide: ProvidersRepository, useValue: mockProvidersRepository },
      ],
    }).compile();

    controller = module.get<ProvidersController>(ProvidersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
