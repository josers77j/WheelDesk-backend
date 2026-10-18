import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import { PurchaseDocumentsService } from '../services/purchase-documents.service';
import {
  PurchaseDocumentEmailDto,
  PurchaseDocumentZipDto,
} from '../dto/purchase-documents.dto';
const formats = { pdf: 'pdf', json: 'json' };
@Controller('purchase-orders')
@Roles(UserRole.ADMIN)
export class PurchaseDocumentsController {
  constructor(private readonly documents: PurchaseDocumentsService) {}
  @Get(':id/document-files/:format')
  async file(
    @Param('id', ParseIntPipe) id: number,
    @Param('format', new ParseEnumPipe(formats)) format: 'pdf' | 'json',
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.documents.file(id, format);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename="${file.filename.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      'Content-Length': file.buffer.length,
      'Cache-Control': 'private, no-store',
    });
    res.send(file.buffer);
  }
  @Post(':id/documents/email')
  email(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PurchaseDocumentEmailDto,
  ): Promise<{ message: string }> {
    return this.documents.email(id, dto);
  }
  @Post('documents/zip')
  async zip(
    @Body() dto: PurchaseDocumentZipDto,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.documents.zip(dto);
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="documentos-compras.zip"',
      'Content-Length': buffer.length,
      'Cache-Control': 'private, no-store',
    });
    res.send(buffer);
  }
}
