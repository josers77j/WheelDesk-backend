import { Injectable } from '@nestjs/common';
import { PrinterService } from '../../printer/printer.service';
import { quotationReport } from '../reports/quotation.report';
import { QuotationsService } from './quotations.service';

@Injectable()
export class QuotationDocumentsService {
  constructor(
    private readonly quotations: QuotationsService,
    private readonly printer: PrinterService,
  ) {}

  async buildPdf(id: number): Promise<{ filename: string; buffer: Buffer }> {
    const quotation = await this.quotations.findOneById(id);
    const buffer = await this.printer.createPdfBuffer(
      quotationReport(quotation),
    );
    const filename = `${quotation.documentNumber.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100)}.pdf`;
    return { filename, buffer };
  }
}
