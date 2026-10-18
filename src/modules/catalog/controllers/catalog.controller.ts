import { Controller, Get, Param, Query } from '@nestjs/common';

import { CatalogService } from '../services/catalog.service';
import type { CatalogType } from '../types/catalog.type';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('category/:catalog')
  findAll(
    @Param('catalog') catalog: CatalogType,
    @Query('filter') filter?: string,
  ) {
    return this.catalogService.findAll(catalog, filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catalogService.findOne(+id);
  }
}
