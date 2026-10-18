import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '../prisma/generated/prisma/client';
import { StorageService } from '../src/modules/storage/services/storage.service';
import { ProductsService } from '../src/modules/products/services/products.service';
import { ProductsRepository } from '../src/modules/products/repositories/products.repository';
import { AssistedPurchaseService } from '../src/modules/purchase-orders/services/assisted-purchase.service';
import { parseAssistedPurchase } from '../src/modules/purchase-orders/dto/assisted-purchase.dto';
import { upload } from './sale-test-fixtures';

async function main(): Promise<void> {
  const url = process.env.PURCHASE_QA_DATABASE_URL;
  if (url !== 'postgresql://postgres@127.0.0.1:56414/postgres')
    throw new Error(
      'This test only accepts the isolated purchase QA database.',
    );
  const prisma = new PrismaService(new ConfigService({ DATABASE_URL: url }));
  class QAStorage extends StorageService {
    readonly objects = new Set<string>();
    override uploadPurchaseDocument(
      _buffer: Buffer,
      key: string,
      contentType: string,
    ): Promise<void> {
      assert.ok(['application/pdf', 'application/json'].includes(contentType));
      this.objects.add(key);
      return Promise.resolve();
    }
    override deletePurchaseDocument(key: string): Promise<void> {
      this.objects.delete(key);
      return Promise.resolve();
    }
  }
  const storage = new QAStorage(new ConfigService({ AWS_REGION: 'us-east-1' }));
  const objects = storage.objects;
  const products = new ProductsService(
    new ProductsRepository(prisma),
    prisma,
    storage,
  );
  const service = new AssistedPurchaseService(prisma, products, storage);
  try {
    const user = await prisma.user.create({
      data: {
        name: 'QA',
        email: `${randomUUID()}@example.invalid`,
        password: 'not-a-login-password',
        role: 'ADMIN',
      },
    });
    const context = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: UserRole.ADMIN,
    };
    const warehouse = await prisma.warehouse.create({
      data: { name: 'Purchase QA' },
    });
    const item = await prisma.electronicInvoiceItemTypeCatalog.create({
      data: { code: '1', name: 'Bienes' },
    });
    const unit = await prisma.electronicInvoiceUnitOfMeasureCatalog.create({
      data: { code: '59', name: 'Unidad' },
    });
    const provider = {
      name: 'QA supplier',
      nrc: '338',
      nit: '0614-000000-000-0',
    };
    const product = {
      type: 'SUPPLY',
      brand: { name: 'QA BRAND' },
      supply: {
        name: 'QA valve',
        salePrice: 15,
        itemTypeCatalogId: item.id,
        unitOfMeasureCatalogId: unit.id,
      },
    };
    const body = {
      requestId: randomUUID(),
      warehouseId: warehouse.id,
      mode: 'MANUAL',
      provider,
      details: [
        {
          key: randomUUID(),
          description: 'QA valve',
          quantity: 2,
          unitPrice: '10.5',
          product,
        },
      ],
    };
    const dto = await parseAssistedPurchase(body);
    const first = await service.create(dto, context, []);
    assert.equal(
      (await prisma.product.findFirstOrThrow({ where: { name: 'QA valve' } }))
        .stock,
      0,
    );
    assert.equal(
      (await prisma.provider.findFirstOrThrow({ where: { nrc: '338' } })).nit,
      '06140000000000',
    );
    const replay = await service.create(dto, context, []);
    assert.equal(replay.id, first.id);
    assert.equal(replay.replayed, true);
    assert.equal(await prisma.purchaseOrder.count(), 1);
    const storedProvider = await prisma.provider.findFirstOrThrow({
      where: { nrc: '338' },
    });
    const storedProduct = await prisma.product.findFirstOrThrow({
      where: { name: 'QA valve' },
    });
    const concurrent = await parseAssistedPurchase({
      requestId: randomUUID(),
      mode: 'MANUAL',
      providerId: storedProvider.id,
      details: [
        {
          key: randomUUID(),
          description: 'Existing',
          quantity: 1,
          unitPrice: '2',
          productId: storedProduct.id,
        },
      ],
    });
    const outcomes = await Promise.allSettled([
      service.create(concurrent, context, []),
      service.create(concurrent, context, []),
    ]);
    assert.equal(
      outcomes.filter((result) => result.status === 'fulfilled').length >= 1,
      true,
    );
    assert.equal(await prisma.purchaseOrder.count(), 2);
    assert.equal(
      (
        await prisma.purchaseOrder.findUniqueOrThrow({
          where: { requestId: concurrent.requestId },
        })
      ).destinationWarehouseId,
      null,
    );
    const before = {
      providers: await prisma.provider.count(),
      brands: await prisma.brand.count(),
      products: await prisma.product.count(),
      orders: await prisma.purchaseOrder.count(),
    };
    const source = {
      identificacion: { codigoGeneracion: 'QA-INVOICE-FAIL' },
      emisor: { nombre: 'QA new supplier', nrc: '999', nit: '12345678901234' },
      cuerpoDocumento: [
        {
          numItem: 1,
          tipoItem: 1,
          descripcion: 'New valid',
          cantidad: 1,
          precioUni: 10,
        },
        {
          numItem: 2,
          tipoItem: 1,
          descripcion: 'Invalid catalog',
          cantidad: 1,
          precioUni: 10,
        },
      ],
    };
    const failure = await parseAssistedPurchase({
      requestId: randomUUID(),
      warehouseId: warehouse.id,
      mode: 'DOCUMENT',
      source: 'JSON',
      pdfConfirmed: true,
      provider: { name: 'QA new supplier', nrc: '999', nit: '12345678901234' },
      details: [
        {
          key: randomUUID(),
          sourceLine: 1,
          description: 'New valid',
          quantity: 1,
          unitPrice: '10',
          product: {
            ...product,
            brand: { name: 'ROLLBACK BRAND' },
            supply: { ...product.supply, name: 'Rollback first' },
          },
        },
        {
          key: randomUUID(),
          sourceLine: 2,
          description: 'Invalid catalog',
          quantity: 1,
          unitPrice: '10',
          product: {
            ...product,
            brand: { name: 'ROLLBACK BRAND' },
            supply: {
              ...product.supply,
              name: 'Rollback second',
              unitOfMeasureCatalogId: 999999,
            },
          },
        },
      ],
    });
    const files = [
      upload('invoice.json', JSON.stringify(source)),
      upload('invoice.pdf', '%PDF-1.7 QA'),
    ];
    await assert.rejects(service.create(failure, context, files));
    assert.deepEqual(
      {
        providers: await prisma.provider.count(),
        brands: await prisma.brand.count(),
        products: await prisma.product.count(),
        orders: await prisma.purchaseOrder.count(),
      },
      before,
    );
    assert.equal(objects.size, 0);
    const bad = await parseAssistedPurchase({
      ...body,
      requestId: randomUUID(),
      mode: 'DOCUMENT',
      source: 'JSON',
      providerId: storedProvider.id,
      provider: undefined,
      details: [
        {
          key: randomUUID(),
          sourceLine: 1,
          description: 'New valid',
          quantity: 99,
          unitPrice: '10',
          productId: storedProduct.id,
        },
      ],
    });
    await assert.rejects(
      service.create(bad, context, [
        upload('invoice.json', JSON.stringify(source)),
      ]),
    );
    assert.equal(await prisma.purchaseOrder.count(), 2);
    await assert.rejects(
      service.create(dto, { ...context, id: user.id + 100 }, []),
    );
    const edit = await parseAssistedPurchase({
      requestId: randomUUID(),
      mode: 'MANUAL',
      providerId: storedProvider.id,
      details: [
        {
          key: randomUUID(),
          description: 'Edited new',
          quantity: 3,
          unitPrice: '8',
          product: {
            ...product,
            brand: { name: 'EDIT BRAND' },
            supply: { ...product.supply, name: 'Edited new' },
          },
        },
      ],
    });
    const edits = await Promise.all([
      service.update(first.id, edit, context),
      service.update(first.id, edit, context),
    ]);
    assert.equal(edits.filter((result) => result.replayed).length, 1);
    const editedProduct = await prisma.product.findFirstOrThrow({
      where: { name: 'Edited new' },
    });
    assert.equal(editedProduct.stock, 0);
    const editedOrder = await prisma.purchaseOrder.findUniqueOrThrow({
      where: { id: first.id },
      include: { details: true },
    });
    assert.equal(editedOrder.details.length, 1);
    assert.equal(editedOrder.details[0].productId, editedProduct.id);
    assert.equal(editedOrder.total.toString(), '24');
    const beforeEdit = {
      providers: await prisma.provider.count(),
      brands: await prisma.brand.count(),
      products: await prisma.product.count(),
    };
    await assert.rejects(
      service.update(
        first.id,
        await parseAssistedPurchase({
          ...failure,
          requestId: randomUUID(),
          mode: 'MANUAL',
          source: undefined,
        }),
        context,
      ),
    );
    assert.deepEqual(
      {
        providers: await prisma.provider.count(),
        brands: await prisma.brand.count(),
        products: await prisma.product.count(),
      },
      beforeEdit,
    );
    assert.deepEqual(
      (
        await prisma.purchaseOrder.findUniqueOrThrow({
          where: { id: first.id },
          include: { details: true },
        })
      ).details,
      editedOrder.details,
    );
    const documentSource = {
      identificacion: { codigoGeneracion: 'QA-INVOICE-SUCCESS' },
      emisor: {
        nombre: storedProvider.name,
        nrc: storedProvider.nrc,
        nit: storedProvider.nit,
      },
      cuerpoDocumento: [
        {
          numItem: 7,
          tipoItem: 1,
          descripcion: 'Original invoice line',
          cantidad: 1,
          precioUni: 10,
        },
      ],
    };
    const documentDto = await parseAssistedPurchase({
      requestId: randomUUID(),
      mode: 'DOCUMENT',
      source: 'JSON',
      providerId: storedProvider.id,
      details: [
        {
          key: randomUUID(),
          sourceLine: 7,
          description: 'Original invoice line',
          quantity: 1,
          unitPrice: '10',
          productId: storedProduct.id,
        },
      ],
    });
    const documentOrder = await service.create(documentDto, context, [
      upload('success.json', JSON.stringify(documentSource)),
    ]);
    const beforeDocument = await prisma.purchaseOrderDocument.findUniqueOrThrow(
      { where: { purchaseOrderId: documentOrder.id } },
    );
    const documentEdit = await parseAssistedPurchase({
      ...documentDto,
      requestId: randomUUID(),
      details: [
        {
          ...documentDto.details[0],
          productId: undefined,
          product: {
            ...product,
            brand: { name: 'EDIT BRAND' },
            supply: { ...product.supply, name: 'Document new' },
          },
        },
      ],
    });
    await service.update(documentOrder.id, documentEdit, context);
    assert.deepEqual(
      await prisma.purchaseOrderDocument.findUniqueOrThrow({
        where: { purchaseOrderId: documentOrder.id },
      }),
      beforeDocument,
    );
    const tamperedEdit = await parseAssistedPurchase({
      ...documentEdit,
      requestId: randomUUID(),
      details: [{ ...documentEdit.details[0], quantity: 2 }],
    });
    await assert.rejects(
      service.update(documentOrder.id, tamperedEdit, context),
    );
    const crossUser = { ...context, id: context.id + 100 };
    await assert.rejects(service.update(first.id, edit, crossUser));
    await prisma.purchaseOrder.update({
      where: { id: first.id },
      data: { status: 'COMPLETED' },
    });
    await assert.rejects(
      service.update(
        first.id,
        await parseAssistedPurchase({ ...edit, requestId: randomUUID() }),
        context,
      ),
    );
    assert.equal(
      (await service.update(first.id, edit, context)).replayed,
      true,
    );
    await assert.rejects(service.cleanup(edit.requestId, context));
    console.log(
      'PASS: atomic catalog/order, normalized fiscal IDs, zero stock, replay, concurrent retry, rollback + S3 cleanup, JSON tampering, transactional editing with new products, edit replay, preserved documents, readonly status and ownership.',
    );
  } finally {
    await prisma.$disconnect();
  }
}
void main().catch((error: unknown): void => {
  console.error(error instanceof Error ? error.message : 'Purchase QA failed');
  process.exitCode = 1;
});
