import { PrismaService } from '@prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { PrinterService } from '../../printer/printer.service';
import { quotationReport } from '../reports/quotation.report';
import { QuotationsService } from './quotations.service';

@Injectable()
export class QuotationDocumentsService {
  constructor(
    private readonly quotations: QuotationsService,
    private readonly printer: PrinterService,
    private readonly prisma: PrismaService,
  ) {}

  async buildPdf(id: number): Promise<{ filename: string; buffer: Buffer }> {
    const quotation = await this.quotations.findOneById(id);
    const company = await this.prisma.companySettings.findFirst({
      select: {
        legalName: true,
        tradeName: true,
        address: true,
        nit: true,
        nrc: true,
        phone: true,
        email: true,
        district: { select: { municipality: { select: { name: true } } } },
      },
    });
    const customer = quotation.customerId
      ? await this.prisma.customer.findUnique({
          where: { id: quotation.customerId },
          select: {
            taxInfo: {
              select: {
                taxDocumentNumber: true,
                nrc: true,
                economicActivity: { select: { name: true } },
              },
            },
            district: {
              select: {
                municipality: {
                  select: {
                    name: true,
                    department: { select: { name: true } },
                  },
                },
              },
            },
          },
        })
      : null;
    const buffer = await this.printer.createPdfBuffer(
      quotationReport(quotation, { company, customer }),
    );
    const filename = `${quotation.documentNumber.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100)}.pdf`;
    return { filename, buffer };
  }
}
