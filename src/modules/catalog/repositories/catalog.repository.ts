import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

const LIMIT = 5;

@Injectable()
export class CatalogRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findEconomicActivity(filter: string) {
    return await this.prismaService.electronicInvoiceEconomicActivityCatalog.findMany(
      {
        where: {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
          // Activities without a code cannot be stored in the invoice.
          code: { not: null },
          isActive: true,
        },
        take: LIMIT,
      },
    );
  }

  async findTaxDocumentType(filter: string) {
    return await this.prismaService.electronicInvoiceTaxDocumentTypeCatalog.findMany(
      {
        where: {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
          isActive: true,
        },
        take: LIMIT,
      },
    );
  }

  async findDocumentType(filter: string) {
    return await this.prismaService.electronicInvoiceDocumentTypeCatalog.findMany(
      {
        where: {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
          isActive: true,
        },
        take: LIMIT,
      },
    );
  }

  async findBillingModel(filter: string) {
    return await this.prismaService.electronicInvoiceBillingModelCatalog.findMany(
      {
        where: {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
          isActive: true,
        },
        take: LIMIT,
      },
    );
  }

  async findTransmissionType(filter: string) {
    return await this.prismaService.electronicInvoiceTransmissionTypeCatalog.findMany(
      {
        where: {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
          isActive: true,
        },
        take: LIMIT,
      },
    );
  }

  async findContingencyType(filter: string) {
    return await this.prismaService.electronicInvoiceContingencyTypeCatalog.findMany(
      {
        where: {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
          isActive: true,
        },
        take: LIMIT,
      },
    );
  }

  async findEstablishmentType(filter: string) {
    return await this.prismaService.electronicInvoiceEstablishmentTypeCatalog.findMany(
      {
        where: {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
          isActive: true,
        },
        take: LIMIT,
      },
    );
  }

  async findItemType(filter: string) {
    return await this.prismaService.electronicInvoiceItemTypeCatalog.findMany({
      where: {
        name: {
          contains: filter,
          mode: 'insensitive',
        },
        isActive: true,
      },
      take: LIMIT,
    });
  }

  async findUnitOfMeasure(filter: string) {
    return await this.prismaService.electronicInvoiceUnitOfMeasureCatalog.findMany(
      {
        where: {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
          isActive: true,
        },
        take: LIMIT,
      },
    );
  }

  async findTribute(filter: string) {
    return await this.prismaService.electronicInvoiceTributeCatalog.findMany({
      where: {
        name: {
          contains: filter,
          mode: 'insensitive',
        },
        isActive: true,
      },
      take: LIMIT,
    });
  }

  async findOperationCondition(filter: string) {
    return await this.prismaService.electronicInvoiceOperationConditionCatalog.findMany(
      {
        where: {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
          isActive: true,
        },
        take: LIMIT,
      },
    );
  }

  async findPaymentMethode(filter: string) {
    return await this.prismaService.electronicInvoicePaymentMethodCatalog.findMany(
      {
        where: {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
          isActive: true,
        },
        take: LIMIT,
      },
    );
  }

  async findPaymentTerm(filter: string) {
    return await this.prismaService.electronicInvoicePaymentTermCatalog.findMany(
      {
        where: {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
          isActive: true,
        },
        take: LIMIT,
      },
    );
  }

  async findOtherAssociatedDocument(filter: string) {
    return await this.prismaService.electronicInvoiceOtherAssociatedDocumentCatalog.findMany(
      {
        where: {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
          isActive: true,
        },
        take: LIMIT,
      },
    );
  }

  async findContingencyDocument(filter: string) {
    return await this.prismaService.electronicInvoiceContingencyDocumentTypeCatalog.findMany(
      {
        where: {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
          isActive: true,
        },
        take: LIMIT,
      },
    );
  }

  async findInvalidationType(filter: string) {
    return await this.prismaService.electronicInvoiceInvalidationTypeCatalog.findMany(
      {
        where: {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
          isActive: true,
        },
        take: LIMIT,
      },
    );
  }
}
