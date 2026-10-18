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
import { GetUser } from '../../../common/decorators/current-user.decorator';
import type { ContextUser } from '../../../common/interfaces/context-user.interface';
import { CustomerService } from '../services/customer.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @AuditAction('customer.create', 'customer')
  @Post()
  create(
    @Body() createCustomerDto: CreateCustomerDto,
    @GetUser() user: ContextUser,
  ): ReturnType<CustomerService['create']> {
    return this.customerService.create(createCustomerDto, user.id);
  }

  @Get()
  findAll(@Query() filterPaginationDto: FilterPaginationDto) {
    return this.customerService.findAll(filterPaginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.findOneById(id);
  }

  @AuditAction('customer.update', 'customer')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(id, updateCustomerDto);
  }

  @AuditAction('customer.delete', 'customer')
  @Delete(':id')
  deleteCustomer(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.deleteCustomer(id);
  }
}
