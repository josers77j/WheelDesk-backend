import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '@prisma/prisma.service';
import { StorageService } from '../../storage/services/storage.service';
import { svTodayKey } from '../../dashboard/utils/dashboard-date.util';
import { AccountingReportQueryDto } from '../dto/accounting-report-query.dto';
import { reportRange } from '../utils/report-range.util';
import { documentPeriod, DocumentPeriod } from '../utils/document-period.util';
import { SaleDocumentsService } from './sale-documents.service';

@Injectable()
export class AccountingReportsService {
  private readonly logger = new Logger(AccountingReportsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: SaleDocumentsService,
    private readonly storage: StorageService,
  ) {}

  period(): Promise<DocumentPeriod> {
    return documentPeriod(this.prisma);
  }

  async export(
    query: AccountingReportQueryDto,
  ): Promise<{ url: string; filename: string; expiresIn: number }> {
    this.validate(query);
    const filename = `documentos-${query.from}_${query.to}.zip`;
    const buffer = await this.buildBuffer(query);
    const key = `reports/temporary/${randomUUID()}.zip`;
    try {
      await this.storage.uploadDoc(buffer, key, 'application/zip');
      return {
        url: await this.storage.getDocUrl(key, 900, filename),
        filename,
        expiresIn: 900,
      };
    } catch (error: unknown) {
      try {
        await this.storage.deleteDoc(key);
      } catch {
        this.logger.warn(
          'Could not remove a temporary report after export failed.',
        );
      }
      throw error;
    }
  }

  private validate(query: AccountingReportQueryDto): void {
    if (!query.from || !query.to)
      throw new BadRequestException(
        'Seleccione ambas fechas para descargar el reporte.',
      );
    if (!/^(pdf|json|excel)(,(pdf|json|excel))*$/.test(query.formats))
      throw new BadRequestException('Seleccione PDF, JSON o Excel.');
    const formats = query.formats.split(',');
    if (new Set(formats).size !== formats.length)
      throw new BadRequestException('Seleccione formatos sin repetir.');
    const { fromKey, toKey } = reportRange(query.from, query.to);
    const days =
      (Date.parse(`${toKey}T12:00:00Z`) - Date.parse(`${fromKey}T12:00:00Z`)) /
        86_400_000 +
      1;
    if (days > 31)
      throw new BadRequestException('Seleccione un período de hasta 31 días.');
    if (toKey > svTodayKey())
      throw new BadRequestException(
        'La fecha final no puede ser posterior a hoy.',
      );
  }

  private async buildBuffer(query: AccountingReportQueryDto): Promise<Buffer> {
    const selected = query.formats.split(',');
    const formats: ('pdf' | 'json')[] = [];
    if (selected.includes('pdf')) formats.push('pdf');
    if (selected.includes('json')) formats.push('json');
    let excel: Buffer | undefined;
    if (selected.includes('excel')) {
      const result = await this.documents.buildExcelSummary(
        query.from,
        query.to,
        true,
      );
      if (result.capped)
        throw new BadRequestException(
          'El reporte supera 5000 ventas. Seleccione un período menor.',
        );
      if (result.total === 0)
        throw new NotFoundException(
          'No hay documentos adjuntos en el período seleccionado.',
        );
      excel = result.buffer;
    }
    return (
      await this.documents.buildRangeZip(query.from, query.to, {
        formats,
        ...(excel ? { excel } : {}),
        ...(selected.length > 1 && formats.length
          ? { directory: 'facturas/' }
          : {}),
      })
    ).buffer;
  }
}
