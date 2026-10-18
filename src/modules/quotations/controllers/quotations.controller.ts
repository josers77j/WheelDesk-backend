import { AuditAction } from '../../audit/decorators/audit-action.decorator';
import { SendQuotationDto } from '../dto/send-quotation.dto';
import { QuotationDeliveryService } from '../services/quotation-delivery.service';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { QuotationDocumentsService } from '../services/quotation-documents.service';
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import { QuotationsService } from '../services/quotations.service';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { UpdateQuotationDto } from '../dto/update-quotation.dto';
import { GetUser } from '../../../common/decorators/current-user.decorator';
import type { ContextUser } from '../../../common/interfaces/context-user.interface';

@Controller('quotations')
export class QuotationsController {
  constructor(
    private readonly quotationsService: QuotationsService,
    private readonly documentsService: QuotationDocumentsService,
    private readonly delivery: QuotationDeliveryService,
  ) {}

  @Post('preview')
  preview(
    @Body() dto: CreateQuotationDto,
  ): ReturnType<QuotationsService['preview']> {
    return this.quotationsService.preview(dto);
  }

  @AuditAction('quotation.email', 'quotation')
  @Post(':id/email')
  sendEmail(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendQuotationDto,
  ): ReturnType<QuotationDeliveryService['send']> {
    return this.delivery.send(id, dto.email);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ): Promise<void> {
    const { filename, buffer } = await this.documentsService.buildPdf(id);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    response.send(buffer);
  }

  @AuditAction('quotation.create', 'quotation')
  @Post()
  create(
    @Body() createQuotationDto: CreateQuotationDto,
    @GetUser() user: ContextUser,
  ) {
    return this.quotationsService.create(createQuotationDto, user);
  }

  @Get()
  findAll(@Query() filterPaginationDto: FilterPaginationDto) {
    return this.quotationsService.findAll(filterPaginationDto);
  }

  @Get(':id')
  findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.quotationsService.findOneById(id);
  }

  @AuditAction('quotation.update', 'quotation')
  @Patch(':id')
  updateQuotation(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuotationDto: UpdateQuotationDto,
    @GetUser() user: ContextUser,
  ) {
    return this.quotationsService.updateQuotation(id, updateQuotationDto, user);
  }
}
