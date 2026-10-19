import { PrismaService } from '@prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  Prisma,
  SaleType,
  TaxType,
} from '../../../../prisma/generated/prisma/client';
import { PrinterService } from '../../printer/printer.service';
import { QuotationDocumentsService } from '../services/quotation-documents.service';
import { QuotationsService } from '../services/quotations.service';
import { QuotationDocument, quotationReport } from './quotation.report';

const testQuotation: QuotationDocument = {
  id: 1,
  documentNumber: 'COT-000001',
  customerId: null,
  customerName: 'Cliente de prueba',
  customerAddress: 'Dirección de prueba',
  customer: null,
  saleType: SaleType.INVOICE,
  subtotal: new Prisma.Decimal('41.37'),
  globalDiscount: new Prisma.Decimal('1.17'),
  iva: new Prisma.Decimal('5.23'),
  total: new Prisma.Decimal('45.43'),
  notes: 'Documento sintético para verificar la plantilla.',
  createdById: null,
  updatedById: null,
  createdAt: new Date('2026-10-05T15:00:00Z'),
  updatedAt: new Date('2026-10-05T15:00:00Z'),
  details: [
    {
      id: 1,
      quotationId: 1,
      productId: 1,
      productName: 'Descripción guardada',
      quantity: 3,
      taxType: TaxType.TAXABLE,
      unitPrice: new Prisma.Decimal('10.25'),
      subtotal: new Prisma.Decimal('41.37'),
      discountAmount: new Prisma.Decimal('1.17'),
      amountAfterDiscount: new Prisma.Decimal('40.20'),
      taxAmount: new Prisma.Decimal('5.23'),
      taxableAmount: new Prisma.Decimal('40.20'),
      unitPriceNet: new Prisma.Decimal('9.07'),
      netDiscount: new Prisma.Decimal('1.17'),
      product: { id: 1, name: 'Nombre actual diferente' },
    },
  ],
};

describe('Quotation PDF', () => {
  it('loads configured company data before rendering the PDF', async (): Promise<void> => {
    const company = {
      legalName: 'Empresa de prueba',
      tradeName: null,
      address: 'Dirección',
      nit: 'NIT de prueba',
      nrc: null,
      phone: '00000000',
      email: 'example@example.com',
    };
    const findFirst = jest.fn(
      (): Promise<typeof company> => Promise.resolve(company),
    );
    const render = jest
      .fn<Promise<Buffer>, [unknown]>()
      .mockResolvedValue(Buffer.from('%PDF'));
    const module = await Test.createTestingModule({
      providers: [
        QuotationDocumentsService,
        {
          provide: QuotationsService,
          useValue: {
            findOneById: (): Promise<QuotationDocument> =>
              Promise.resolve(testQuotation),
          },
        },
        {
          provide: PrismaService,
          useValue: { companySettings: { findFirst } },
        },
        { provide: PrinterService, useValue: { createPdfBuffer: render } },
      ],
    }).compile();
    const result = await module.get(QuotationDocumentsService).buildPdf(1);
    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(render.mock.calls[0][0])).toContain(
      'Empresa de prueba',
    );
    expect(result.filename).toBe('COT-000001.pdf');
  });

  it('preserves stored totals and product snapshot instead of recalculating', () => {
    const serialized = JSON.stringify(quotationReport(testQuotation));
    expect(serialized).toContain('Total: $45.43');
    expect(serialized).toContain('$41.37');
    expect(serialized).not.toContain('$30.75');
    expect(serialized).toContain('Descripción guardada');
    expect(serialized).not.toContain('Nombre actual diferente');
  });

  it('matches the reference grid and uses configured company details', (): void => {
    const serialized = JSON.stringify(
      quotationReport(testQuotation, {
        company: {
          legalName: 'Empresa de prueba',
          tradeName: null,
          address: 'Dirección comercial',
          nit: 'Identificador de prueba',
          nrc: 'Registro de prueba',
          phone: '00000000',
          email: 'example@example.com',
        },
      }),
    );
    for (const label of [
      'Empresa de prueba',
      'Dirección comercial',
      'Registro de prueba',
      'Cant.',
      'Descripción',
      'Precio unitario',
      'V. no sujetas',
      'Ventas exentas',
      'Ventas afectadas',
    ])
      expect(serialized).toContain(label);
    expect(serialized).not.toContain('Comprobante de crédito fiscal');
  });

  it('renders real PDF bytes with many rows', async () => {
    const definition = quotationReport({
      ...testQuotation,
      details: Array.from({ length: 80 }, (_, index) => ({
        ...testQuotation.details[0],
        id: index + 1,
        productName: `Producto de prueba ${index + 1}`,
      })),
    });
    const buffer = await new PrinterService().createPdfBuffer(definition);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('does not render when the quotation is missing', async () => {
    const findOneById: jest.MockedFunction<QuotationsService['findOneById']> =
      jest.fn();
    const render: jest.MockedFunction<PrinterService['createPdfBuffer']> =
      jest.fn();
    findOneById.mockRejectedValue(
      new NotFoundException('Cotización no encontrada'),
    );
    const module = await Test.createTestingModule({
      providers: [
        QuotationDocumentsService,
        { provide: PrismaService, useValue: {} },
        { provide: QuotationsService, useValue: { findOneById } },
        { provide: PrinterService, useValue: { createPdfBuffer: render } },
      ],
    }).compile();
    await expect(
      module.get(QuotationDocumentsService).buildPdf(99),
    ).rejects.toThrow(NotFoundException);
    expect(render).not.toHaveBeenCalled();
  });
});
