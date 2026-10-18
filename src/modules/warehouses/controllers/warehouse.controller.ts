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
import { WarehouseService } from '../services/warehouse.service';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { SearchWarehouseQueryDto } from '../dto/search-query.dto';

@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  create(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehouseService.create(createWarehouseDto);
  }

  @Get()
  findAll(@Query() filterPaginationDto: FilterPaginationDto) {
    return this.warehouseService.findAll(filterPaginationDto);
  }

  @Get('search-by-name')
  searchWarehousesByName(
    @Query() query: SearchWarehouseQueryDto,
  ): ReturnType<WarehouseService['searchWarehousesByName']> {
    return this.warehouseService.searchWarehousesByName(
      query.name,
      query.limit,
      query.productId,
      query.stockStatus,
    );
  }

  @Get(':id')
  findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.warehouseService.findOneById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
  ) {
    return this.warehouseService.update(id, updateWarehouseDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.warehouseService.remove(id);
  }
}
