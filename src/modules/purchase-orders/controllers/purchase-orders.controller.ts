import { AuditAction } from '../../audit/decorators/audit-action.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';

import { PurchaseOrdersService } from '../services/purchase-orders.service';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';

import { UpdatePurchaseOrderDto } from '../dto/update-purchase-order.dto';
import { ApprovePurchaseOrderDto } from '../dto/approve-purchase-order.dto';
import { GetUser } from '../../../common/decorators/current-user.decorator';
import type { ContextUser } from '../../../common/interfaces/context-user.interface';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @AuditAction('purchase.create', 'purchase-order')
  @Post()
  create(
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
    @GetUser() user: ContextUser,
  ) {
    return this.purchaseOrdersService.create(createPurchaseOrderDto, user);
  }

  @Get()
  findAll(@Query() filterPaginationDto: FilterPaginationDto) {
    return this.purchaseOrdersService.findAll(filterPaginationDto);
  }

  @Get(':id')
  findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.findOneById(id);
  }

  @Get(':id/zone-preview')
  previewZoneResolutions(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.previewZoneResolutions(id);
  }

  @AuditAction('purchase.update', 'purchase-order')
  @Patch(':id')
  updatePurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    @GetUser() user: ContextUser,
  ) {
    return this.purchaseOrdersService.updatePurchaseOrder(
      id,
      updatePurchaseOrderDto,
      user,
    );
  }

  @AuditAction('purchase.reject', 'purchase-order')
  @Delete('reject-order/:id')
  rejectPurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: ContextUser,
  ): ReturnType<PurchaseOrdersService['rejectPurchaseOrder']> {
    return this.purchaseOrdersService.rejectPurchaseOrder(id, user.id);
  }

  @AuditAction('purchase.approve', 'purchase-order')
  @Post('approve-order/:id')
  approvePurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() approvePurchaseOrderDto: ApprovePurchaseOrderDto,
    @GetUser() user: ContextUser,
  ) {
    return this.purchaseOrdersService.approvePurchaseOrder(
      id,
      user,
      approvePurchaseOrderDto,
    );
  }
}
