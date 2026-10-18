import { asymmetric } from '../../../test/helpers/jest-matchers';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { Server } from 'node:http';
import { UserRole } from '../../../prisma/generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ContextUser } from '../../common/interfaces/context-user.interface';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditService } from './services/audit.service';
import { AuditActionInterceptor } from './interceptors/audit-action.interceptor';
import { CustomerController } from '../customer/controllers/customer.controller';
import { CustomerService } from '../customer/services/customer.service';
import { CustomerRepository } from '../customer/repositories/customer.repository';
import { ProductsController } from '../products/controllers/products.controller';
import { ProductsService } from '../products/services/products.service';
import { ProductsRepository } from '../products/repositories/products.repository';
import { StorageService } from '../storage/services/storage.service';

describe('Authenticated product attribution', () => {
  let app: INestApplication;
  let actor: ContextUser;
  const log = jest.fn();
  const update = jest.fn();
  const createCustomer = jest.fn().mockResolvedValue({ id: 61 });
  const create = jest.fn<Promise<{ id: number }>, [unknown]>();

  beforeEach(async (): Promise<void> => {
    actor = {
      id: 27,
      name: 'Operator',
      email: 'operator@example.test',
      role: UserRole.ADMIN,
    };
    log.mockReset().mockResolvedValue(undefined);
    update.mockReset().mockResolvedValue({ id: 92 });
    createCustomer.mockClear();
    create.mockReset().mockResolvedValue({ id: 92 });
    const module = await Test.createTestingModule({
      controllers: [ProductsController, CustomerController],
      providers: [
        ProductsService,
        ProductsRepository,
        CustomerService,
        CustomerRepository,
        { provide: AuditService, useValue: { log } },
        { provide: APP_INTERCEPTOR, useClass: AuditActionInterceptor },
        {
          provide: PrismaService,
          useValue: {
            product: {
              create,
              update,
              findUnique: jest
                .fn()
                .mockResolvedValue({ id: 92, type: 'SUPPLY' }),
            },
            customer: { create: createCustomer },
            electronicInvoiceItemTypeCatalog: {
              findFirstOrThrow: jest.fn().mockResolvedValue({ id: 1 }),
            },
          },
        },
        { provide: StorageService, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    app.use(
      (
        req: Request & { user?: ContextUser },
        _res: Response,
        next: NextFunction,
      ): void => {
        req.user = actor;
        next();
      },
    );
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async (): Promise<void> => {
    await app.close();
  });

  const supply = {
    name: 'Valve',
    itemTypeCatalogId: 1,
    unitOfMeasureCatalogId: 35,
  };

  it('persists the authenticated creator separately for consecutive users', async (): Promise<void> => {
    await request(httpServer(app))
      .post('/products/create-supply')
      .send(supply)
      .expect(201);
    expect(create).toHaveBeenLastCalledWith(
      asymmetric(
        expect.objectContaining({
          data: asymmetric(
            expect.objectContaining({ createdById: 27, updatedById: 27 }),
          ),
        }),
      ),
    );
    expect(log).toHaveBeenLastCalledWith(
      asymmetric(
        expect.objectContaining({
          userId: 27,
          action: 'product.create',
          entityId: '92',
          metadata: { actorName: 'Operator' },
        }),
      ),
    );
    actor = { ...actor, id: 48, name: 'Second operator' };
    await request(httpServer(app))
      .post('/products/create-supply')
      .send(supply)
      .expect(201);
    expect(create).toHaveBeenLastCalledWith(
      asymmetric(
        expect.objectContaining({
          data: asymmetric(
            expect.objectContaining({ createdById: 48, updatedById: 48 }),
          ),
        }),
      ),
    );
  });

  it('rejects an author supplied in the body', async (): Promise<void> => {
    await request(httpServer(app))
      .post('/products/create-supply')
      .send({ ...supply, createdById: 1 })
      .expect(400);
    expect(create).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });
  it('attributes the last edit and audit event to the next authenticated user', async (): Promise<void> => {
    actor = { ...actor, id: 48, name: 'Editor' };
    await request(httpServer(app))
      .patch('/products/update-supply/92')
      .send({ name: 'Updated valve' })
      .expect(200);
    expect(update).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          data: asymmetric(expect.objectContaining({ updatedById: 48 })),
        }),
      ),
    );
    expect(update).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          data: asymmetric(
            expect.not.objectContaining({
              createdById: asymmetric(expect.anything()),
            }),
          ),
        }),
      ),
    );
    expect(log).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          userId: 48,
          action: 'product.update',
          entityId: '92',
        }),
      ),
    );
  });

  it('attributes customer creation to the authenticated user', async (): Promise<void> => {
    await request(httpServer(app))
      .post('/customers')
      .send({ name: 'Customer', isTaxPayer: false, customerType: 'NATURAL' })
      .expect(201);
    expect(createCustomer).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          data: asymmetric(
            expect.objectContaining({ createdBy: { connect: { id: 27 } } }),
          ),
        }),
      ),
    );
    expect(log).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          userId: 27,
          action: 'customer.create',
          entityId: '61',
        }),
      ),
    );
  });

  it('attributes both the product and the nested tire when creating a tire', async (): Promise<void> => {
    await request(httpServer(app))
      .post('/products/create-tire')
      .send({
        itemTypeCatalogId: 1,
        unitOfMeasureCatalogId: 35,
        brandId: 3,
        salePrice: 26,
        tire: {
          width: 225,
          aspectRatio: 50,
          rimDiameter: 15,
          construction: 'RADIAL',
          condition: 'NEW',
          quality: 'A',
          vehicleTypeId: [2],
        },
      })
      .expect(201);
    expect(create).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          data: asymmetric(
            expect.objectContaining({
              createdById: 27,
              updatedById: 27,
              tire: {
                create: asymmetric(
                  expect.objectContaining({
                    createdBy: { connect: { id: 27 } },
                    updatedBy: { connect: { id: 27 } },
                  }),
                ),
              },
            }),
          ),
        }),
      ),
    );
  });
});

function httpServer(app: INestApplication): Server {
  const server: unknown = app.getHttpServer();
  if (!isHttpServer(server)) throw new Error('HTTP server was not initialized');
  return server;
}

function isHttpServer(value: unknown): value is Server {
  return value instanceof Server;
}
