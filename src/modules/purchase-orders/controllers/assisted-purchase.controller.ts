import { AuditAction } from '../../audit/decorators/audit-action.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Patch,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { GetUser } from '../../../common/decorators/current-user.decorator';
import type { ContextUser } from '../../../common/interfaces/context-user.interface';
import { isRecord } from '../../../common/utils/type-guards.util';
import { parseAssistedPurchase } from '../dto/assisted-purchase.dto';
import {
  AssistedPurchaseService,
  AssistedPurchaseResult,
} from '../services/assisted-purchase.service';
import { text } from '../utils/purchase-document.util';
import { BadRequestException } from '@nestjs/common';

@Controller('purchase-orders')
@Roles(UserRole.ADMIN)
export class AssistedPurchaseController {
  constructor(private readonly assisted: AssistedPurchaseService) {}
  @Post('assisted-preview')
  @UseInterceptors(
    FilesInterceptor('files', 1, {
      limits: { files: 1, fileSize: 512 * 1024 },
    }),
  )
  async preview(
    @UploadedFiles() files: Express.Multer.File[] = [],
  ): ReturnType<AssistedPurchaseService['preview']> {
    const file = files[0];
    if (files.length !== 1 || !file)
      throw new BadRequestException(
        'Seleccione una factura JSON para interpretar.',
      );
    return this.assisted.preview(file);
  }
  @Post('assisted-provider-match')
  async match(
    @Body() body: unknown,
  ): ReturnType<AssistedPurchaseService['matchProvider']> {
    if (!isRecord(body))
      throw new BadRequestException('Los datos del proveedor son inválidos.');
    const nrc = text(body.nrc),
      nit = text(body.nit);
    if (
      nrc.length > 30 ||
      nit.length > 30 ||
      !(/^[\d\s-]*$/.test(nrc) && /^[\d\s-]*$/.test(nit))
    )
      throw new BadRequestException('Revise NRC y NIT del proveedor.');
    return this.assisted.matchProvider(nrc, nit);
  }
  @AuditAction('purchase.create', 'purchase-order')
  @Post('assisted')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      limits: { files: 2, fileSize: 512 * 1024 },
    }),
  )
  async create(
    @Body() body: unknown,
    @GetUser() user: ContextUser,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ): Promise<AssistedPurchaseResult> {
    return this.assisted.create(await parseAssistedPurchase(body), user, files);
  }
  @AuditAction('purchase.update', 'purchase-order')
  @Patch('assisted/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @GetUser() user: ContextUser,
  ): Promise<AssistedPurchaseResult> {
    return this.assisted.update(id, await parseAssistedPurchase(body), user);
  }
  @Get(':id/documents')
  documents(
    @Param('id', ParseIntPipe) id: number,
  ): ReturnType<AssistedPurchaseService['documents']> {
    return this.assisted.documents(id);
  }
  @Delete('assisted-attempt/:requestId')
  cleanup(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @GetUser() user: ContextUser,
  ): Promise<void> {
    return this.assisted.cleanup(requestId, user);
  }
}
