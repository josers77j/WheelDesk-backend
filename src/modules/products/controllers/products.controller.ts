import { AuditAction } from '../../audit/decorators/audit-action.decorator';
import { GetUser } from '../../../common/decorators/current-user.decorator';
import type { ContextUser } from '../../../common/interfaces/context-user.interface';
import { SummaryQueryDto } from '../dto/summary-query.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  ParseEnumPipe,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { CreateSupplyDto } from '../dto/create-supply.dto';
import { DeleteProductImagesDto } from '../dto/delete-product-images.dto';
import { CreateServiceDto } from '../dto/create-service.dto';
import { CreateTireDto } from '../dto/create-tire.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { UpdateTireDto } from '../dto/update-tire.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { UpdateSupplyDto } from '../dto/update-supply.dto';
import { PRODUCT_TYPE } from '../enum/product-type.enum';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @AuditAction('product.create', 'product')
  @Post('create-supply')
  createSupply(
    @Body() createSupplyDto: CreateSupplyDto,
    @GetUser() user: ContextUser,
  ): ReturnType<ProductsService['createSupply']> {
    return this.productsService.createSupply(
      createSupplyDto,
      undefined,
      user.id,
    );
  }

  @AuditAction('product.create', 'product')
  @Post('create-service')
  createService(
    @Body() createServiceDto: CreateServiceDto,
    @GetUser() user: ContextUser,
  ): ReturnType<ProductsService['createService']> {
    return this.productsService.createService(createServiceDto, user.id);
  }

  @AuditAction('product.create', 'product')
  @Post('create-tire')
  createTire(
    @Body() createTireDto: CreateTireDto,
    @GetUser() user: ContextUser,
  ): ReturnType<ProductsService['createTire']> {
    return this.productsService.createTire(createTireDto, undefined, user.id);
  }

  @Get()
  findAll(@Query() filterPaginationDto: FilterPaginationDto) {
    return this.productsService.findAll(filterPaginationDto);
  }

  @Get('summary')
  findSummarybyName(
    @Query() query: SummaryQueryDto,
  ): ReturnType<ProductsService['findSummarybyName']> {
    return this.productsService.findSummarybyName(
      query.filter,
      query.quantityStatus,
      query.type,
      query.zoneId,
      query.limit,
    );
  }

  @Get('vehicle-type')
  findProductVehicleType(@Query('name') name: string) {
    return this.productsService.findProductVehicleType(name);
  }

  @Get('vehicle-types')
  findAllVehicleTypes() {
    return this.productsService.findAllVehicleTypes();
  }

  @Get(':id')
  findOneById(
    @Param('id', ParseIntPipe) id: number,
    @Query('productType', new ParseEnumPipe(PRODUCT_TYPE))
    productType: PRODUCT_TYPE,
  ) {
    return this.productsService.findOneById(id, productType);
  }

  @AuditAction('product.update', 'product')
  @Patch('update-tire/:id')
  updateTire(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTireDto: UpdateTireDto,
    @GetUser() user: ContextUser,
  ): ReturnType<ProductsService['updateTire']> {
    return this.productsService.updateTire(id, updateTireDto, user.id);
  }

  @AuditAction('product.update', 'product')
  @Patch('update-service/:id')
  updateService(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceDto: UpdateServiceDto,
    @GetUser() user: ContextUser,
  ): ReturnType<ProductsService['updateService']> {
    return this.productsService.updateService(id, updateServiceDto, user.id);
  }

  @AuditAction('product.update', 'product')
  @Patch('update-supply/:id')
  updateSupply(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplyDto: UpdateSupplyDto,
    @GetUser() user: ContextUser,
  ): ReturnType<ProductsService['updateSupply']> {
    return this.productsService.updateSupply(id, updateSupplyDto, user.id);
  }

  @Delete('delete-product-image')
  deleteProductImage(@Body() dto: DeleteProductImagesDto) {
    return this.productsService.deleteProductImages(dto);
  }

  @AuditAction('product.delete', 'product')
  @Delete(':id')
  deleteProduct(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: ContextUser,
  ): ReturnType<ProductsService['deleteProduct']> {
    return this.productsService.deleteProduct(id, user.id);
  }

  @Post('create-product-image')
  @UseInterceptors(
    FilesInterceptor('productImages', 10, {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  createProductImage(
    @Body('id') rawId: string | number,
    @UploadedFiles() productImages: Express.Multer.File[],
  ) {
    const id = typeof rawId === 'number' ? rawId : Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(
        'El id del producto debe ser un número entero positivo.',
      );
    }
    return this.productsService.createProductImage(id, productImages);
  }
}
