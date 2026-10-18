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
import { ZoneService } from '../services/zone.service';
import { CreateZoneDto } from '../dto/create-zone.dto';
import { UpdateZoneDto } from '../dto/update-zone.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';

@Controller('zones')
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  @Post()
  create(@Body() createZoneDto: CreateZoneDto) {
    return this.zoneService.create(createZoneDto);
  }

  @Get()
  findAll(@Query() filterPaginationDto: FilterPaginationDto) {
    return this.zoneService.findAll(filterPaginationDto);
  }

  // This controller first
  @Get('search-by-name')
  getZoneByName(@Query() filterPaginationDto: FilterPaginationDto) {
    return this.zoneService.getZoneByName(filterPaginationDto);
  }

  @Get(':id/products')
  products(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: FilterPaginationDto,
  ): ReturnType<ZoneService['products']> {
    return this.zoneService.products(id, query);
  }

  @Get(':id')
  findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.zoneService.findOneById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateZoneDto: UpdateZoneDto,
  ) {
    return this.zoneService.update(id, updateZoneDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.zoneService.remove(id);
  }
}
