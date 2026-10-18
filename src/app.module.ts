import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtGuard } from './modules/auth/guards/jwt.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { CommonModule } from './common/common.module';
import { ProductsModule } from './modules/products/products.module';
import { WarehouseModule } from './modules/warehouses/warehouse.module';
import { ZoneModule } from './modules/zones/zone.module';
import { TransfersModule } from './modules/transfers/transfer.module';
import { BrandModule } from './modules/brands/brand.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { CustomerModule } from './modules/customer/customer.module';
import { CompanyModule } from './modules/company/company.module';
import { LocationsModule } from './modules/locations/locations.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { SaleOrdersModule } from './modules/sale-orders/sale-orders.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/envs';
import { MailModule } from './modules/mail/mail.module';
import { PrinterModule } from './modules/printer/printer.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditModule } from './modules/audit/audit.module';
import { MigrationModule } from './modules/migration/migration.module';
import { VersionController } from './version.controller';
import { StorageModule } from './modules/storage/storage.module';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: envValidationSchema,
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    PrismaModule,
    CommonModule,
    ProductsModule,
    WarehouseModule,
    ZoneModule,
    TransfersModule,
    BrandModule,
    ProvidersModule,
    CustomerModule,
    CompanyModule,
    LocationsModule,
    PurchaseOrdersModule,
    SaleOrdersModule,
    CatalogModule,
    QuotationsModule,
    MailModule,
    PrinterModule,
    DashboardModule,
    AuditModule,
    MigrationModule,
    StorageModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
  ],
  controllers: [VersionController],
})
export class AppModule {}
