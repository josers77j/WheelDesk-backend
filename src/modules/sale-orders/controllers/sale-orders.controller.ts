import { AuditAction } from '../../audit/decorators/audit-action.decorator';
import { SendSaleDocumentsDto } from '../dto/send-sale-documents.dto';
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  Res,
  ParseIntPipe,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UpdateSaleOrderDto } from '../dto/update-sale-order.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { SaleOrdersService } from '../services/sale-orders.service';
import { SaleDocumentsService } from '../services/sale-documents.service';
import { SaleCheckoutService } from '../services/sale-checkout.service';
import {
  SaleDeliveryService,
  SaleEmailResult,
} from '../services/sale-delivery.service';
import { GetUser } from '../../../common/decorators/current-user.decorator';
import type { User } from '../../auth/interfaces/user.interface';
import type { Response } from 'express';
import type { CheckoutResponse } from '../interfaces/sale-order.interface';
import { parseCheckoutBody } from '../utils/parse-checkout-body.util';

@Controller('sale-orders')
export class SaleOrdersController {
  constructor(
    private readonly saleOrdersService: SaleOrdersService,
    private readonly saleDocumentsService: SaleDocumentsService,
    private readonly checkoutService: SaleCheckoutService,
    private readonly delivery: SaleDeliveryService,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @AuditAction('sale.create', 'sale-order')
  @Post('checkout')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      limits: { files: 2, fileSize: 10 * 1024 * 1024 },
    }),
  )
  async checkout(
    @Body() body: unknown,
    @GetUser() user: User,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ): Promise<CheckoutResponse> {
    return this.checkoutService.checkout(
      await parseCheckoutBody(body),
      user,
      files,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @AuditAction('invoice.resend', 'sale-order')
  @Post(':id/email')
  sendEmail(
    @Param('id', ParseIntPipe) id: number,
    @Body() options: SendSaleDocumentsDto,
  ): Promise<SaleEmailResult> {
    return this.delivery.send(id, options);
  }

  @Get()
  findAll(
    @Query() filter: FilterPaginationDto,
  ): ReturnType<SaleOrdersService['findAll']> {
    return this.saleOrdersService.findAll(filter);
  }

  @Post(':id/documents')
  documents(
    @Param('id', ParseIntPipe) id: number,
  ): ReturnType<SaleDocumentsService['generate']> {
    return this.saleDocumentsService.generate(id);
  }

  @Get(':id/documents-zip')
  async downloadOrderZip(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    this.sendZip(res, await this.saleDocumentsService.buildOrderZip(id));
  }

  @Get('excel-summary')
  async downloadExcelSummary(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, capped, total } =
      await this.saleDocumentsService.buildExcelSummary(from, to);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="resumen-ventas.xlsx"',
    );
    if (capped) {
      res.setHeader('X-Excel-Capped', 'true');
      res.setHeader('X-Excel-Total', String(total));
    }
    res.send(buffer);
  }

  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.VIEWER)
  @Post('zip')
  async downloadRangeZip(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    this.sendZip(res, await this.saleDocumentsService.buildRangeZip(from, to));
  }

  private sendZip(
    res: Response,
    result: { filename: string; buffer: Buffer },
  ): void {
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.buffer.length,
    });
    res.send(result.buffer);
  }

  @Get(':id')
  findOneById(
    @Param('id', ParseIntPipe) id: number,
  ): ReturnType<SaleOrdersService['findOneById']> {
    return this.saleOrdersService.findOneById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSaleOrderDto,
  ): string {
    return this.saleOrdersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): string {
    return this.saleOrdersService.remove(id);
  }
}
