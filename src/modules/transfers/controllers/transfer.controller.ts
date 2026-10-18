import { AuditAction } from '../../audit/decorators/audit-action.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TransferService } from '../services/transfer.service';
import { CreateTransferDto } from '../dto/create-transfer.dto';
import { FilterTransferDto } from '../dto/filter-transfer.dto';
import { UpdateTransferDto } from '../dto/update-transfer.dto';
import { GetUser } from '../../../common/decorators/current-user.decorator';
import type { ContextUser } from '../../../common/interfaces/context-user.interface';

@Controller('transfers')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @AuditAction('transfer.create', 'transfer')
  @Post()
  execute(
    @Body() createTransferDto: CreateTransferDto,
    @GetUser() user: ContextUser,
  ) {
    return this.transferService.execute(createTransferDto, user);
  }

  @Get()
  findAll(@Query() filterTransferDto: FilterTransferDto) {
    return this.transferService.findAll(filterTransferDto);
  }

  @Get(':id')
  findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.transferService.findOneById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransferDto: UpdateTransferDto,
  ) {
    return this.transferService.update(id, updateTransferDto);
  }

  @AuditAction('transfer.cancel', 'transfer')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: ContextUser) {
    return this.transferService.remove(id, user);
  }
}
