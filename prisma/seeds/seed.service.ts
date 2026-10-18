import { Prisma, PrismaClient } from '../generated/prisma/client';

import { getDefaultUsers } from './data/user.data';
import { departmentData, DepartmentResponse } from './data/deparment.data';
import { billingModel } from './data/billing-model.seed';
import { defaultCompanySettings } from './data/company-settings.seed';
import { contingencyDocumentType } from './data/contingency-document-type.seed';
import { contingencyType } from './data/contingency-type.seed';
import { documentType } from './data/document-type.seed';
import { taxDocumentType } from './data/tax-document-type.seed';
import { economicActivity } from './data/economic-type.seed';
import { establishmentType } from './data/establishment-type.seed';
import { invalidateType } from './data/invalidation-type.seed';
import { itemType } from './data/item-type.seed';
import { operationCondition } from './data/operation-condition.seed';
import { otherAssociatedDocument } from './data/other-associated-document.seed';
import { paymentMethode } from './data/payment-methode.seed';
import { paymentTerm } from './data/payment-term.seed';
import { transmissionType } from './data/transmission-type.seed';
import { tribute } from './data/tribute.seed';
import { unitOfMeasure } from './data/unit-of-measure.seed';
import { seedVehicleTypes } from './vehicle-types';

export class SeedService {
  constructor(private readonly prismaService: PrismaClient) {}

  async createUserSeed(): Promise<Prisma.BatchPayload> {
    const users = getDefaultUsers();
    await this.prismaService.user.deleteMany({});
    return this.prismaService.user.createMany({ data: users });
  }

  async createCompanySettingsSeed(): Promise<
    Prisma.CompanySettingsGetPayload<object>
  > {
    await this.prismaService.companySettings.deleteMany();

    const {
      districtCode,
      externalCode,
      establishmentTypeCatalogCode,
      responsableDocTypeCatalogCode,
      ...data
    } = defaultCompanySettings;

    if (!districtCode) {
      throw new Error('El seed de company settings requiere districtCode');
    }
    const districtId = await this.getDepartment(districtCode);
    if (!districtId) {
      throw new Error(
        `No se encontró el distrito ${districtCode}. Ejecute prisma db seed -- --target catalogs --confirm-reset primero.`,
      );
    }
    const economicActivityId = await this.getEconomicActivity(externalCode);
    if (!economicActivityId) {
      throw new Error(
        `No se encontró la actividad económica ${externalCode}. Ejecute prisma db seed -- --target catalogs --confirm-reset primero.`,
      );
    }
    const establishmentTypeCatalogId = establishmentTypeCatalogCode
      ? await this.getEstablishmentTypeCatalogId(establishmentTypeCatalogCode)
      : undefined;

    if (establishmentTypeCatalogCode && !establishmentTypeCatalogId) {
      throw new Error(
        `Establishment type catalog code ${establishmentTypeCatalogCode} was not found. Seed prisma db seed -- --target catalogs --confirm-reset before company settings.`,
      );
    }
    const responsableDocTypeId = responsableDocTypeCatalogCode
      ? await this.getResponsableDocTypeCatalogId(responsableDocTypeCatalogCode)
      : undefined;
    if (responsableDocTypeCatalogCode && !responsableDocTypeId) {
      throw new Error(
        `Responsable tax document type catalog code ${responsableDocTypeCatalogCode} was not found. Seed prisma db seed -- --target catalogs --confirm-reset before company settings.`,
      );
    }

    const companySettingsData: Prisma.CompanySettingsUncheckedCreateInput = {
      ...data,
      districtId,
      economicActivityId,
      ...(establishmentTypeCatalogId ? { establishmentTypeCatalogId } : {}),
      ...(responsableDocTypeId ? { responsableDocTypeId } : {}),
    };

    return this.prismaService.companySettings.create({
      data: companySettingsData,
    });
  }

  async getDepartment(districtCode: string): Promise<number | undefined> {
    const district = await this.prismaService.district.findUnique({
      where: {
        code: districtCode,
      },
      select: {
        id: true,
      },
    });

    return district?.id;
  }

  async getEconomicActivity(externalCode: string): Promise<number | undefined> {
    const economicActivity =
      await this.prismaService.electronicInvoiceEconomicActivityCatalog.findUnique(
        {
          where: {
            code: externalCode,
          },
          select: {
            id: true,
          },
        },
      );

    return economicActivity?.id;
  }

  async getEstablishmentTypeCatalogId(
    code: string,
  ): Promise<number | undefined> {
    const establishmentTypeCatalog =
      await this.prismaService.electronicInvoiceEstablishmentTypeCatalog.findUnique(
        {
          where: {
            code,
          },
          select: {
            id: true,
          },
        },
      );

    return establishmentTypeCatalog?.id;
  }

  async getResponsableDocTypeCatalogId(
    code: string,
  ): Promise<number | undefined> {
    const responsableDocTypeCatalog =
      await this.prismaService.electronicInvoiceTaxDocumentTypeCatalog.findUnique(
        {
          where: {
            code,
          },
          select: {
            id: true,
          },
        },
      );

    return responsableDocTypeCatalog?.id;
  }

  mapDepartments(
    departmentData: DepartmentResponse[],
  ): Prisma.DepartmentCreateManyInput[] {
    return departmentData.map((department) => {
      const { name, code, externalCode } = department;

      return {
        code,
        name,
        externalCode,
      };
    });
  }

  mapMunicipalities(
    departmentData: DepartmentResponse[],
    departmentByCode: Map<string, number>,
  ): Prisma.MunicipalityCreateManyInput[] {
    return departmentData.flatMap((department) => {
      const departmentId = departmentByCode.get(department.code);
      if (departmentId === undefined) {
        throw new Error(
          `No se encontró el departamento ${department.code} en el mapa de códigos`,
        );
      }
      return department.municipalities.map((municipality) => {
        const { code, name, externalCode } = municipality;
        return {
          code,
          name,
          externalCode,
          departmentId,
        };
      });
    });
  }

  mapDistricts(
    departmentData: DepartmentResponse[],
    municipalityByCode: Map<string, number>,
  ): Prisma.DistrictCreateManyInput[] {
    return departmentData.flatMap((department) =>
      department.municipalities.flatMap((municipality) => {
        const municipalityId = municipalityByCode.get(municipality.code);
        if (municipalityId === undefined) {
          throw new Error(
            `No se encontró el municipio ${municipality.code} en el mapa de códigos`,
          );
        }
        return municipality.districts.map((district) => ({
          ...district,
          municipalityId,
        }));
      }),
    );
  }

  async createVehicleTypesSeed(): Promise<number> {
    return this.prismaService.$transaction((tx) =>
      seedVehicleTypes(tx.vehicleType),
    );
  }

  async createCatalogsSeed(): Promise<{
    message: string;
    counts: Record<string, number>;
  }> {
    return this.prismaService.$transaction(async (tx) => {
      await tx.district.deleteMany({});
      await tx.municipality.deleteMany({});
      await tx.department.deleteMany({});

      const departments = await tx.department.createManyAndReturn({
        data: this.mapDepartments(departmentData),
      });

      const departmentByCode = new Map(
        departments.map((department) => [department.code, department.id]),
      );

      const municipalities = await tx.municipality.createManyAndReturn({
        data: this.mapMunicipalities(departmentData, departmentByCode),
      });

      const municipalityByCode = new Map(
        municipalities.map((municipality) => [
          municipality.code,
          municipality.id,
        ]),
      );

      const districts = await tx.district.createManyAndReturn({
        data: this.mapDistricts(departmentData, municipalityByCode),
      });

      await tx.electronicInvoiceEconomicActivityCatalog.deleteMany({});
      const economicActivityResult =
        await tx.electronicInvoiceEconomicActivityCatalog.createMany({
          data: economicActivity,
        });

      await tx.electronicInvoiceTaxDocumentTypeCatalog.deleteMany({});
      const taxDocumentTypeResult =
        await tx.electronicInvoiceTaxDocumentTypeCatalog.createMany({
          data: taxDocumentType,
        });

      const [
        documentTypeResult,
        billingModelResult,
        transmissionTypeResult,
        contingencyTypeResult,
        establishmentTypeResult,
        itemTypeResult,
        unitOfMeasureResult,
        tributeResult,
        operationConditionResult,
        paymentMethodResult,
        paymentTermResult,
        otherAssociatedDocumentResult,
        contingencyDocumentTypeResult,
        invalidationTypeResult,
      ] = await Promise.all([
        tx.electronicInvoiceDocumentTypeCatalog.createMany({
          data: documentType,
          skipDuplicates: true,
        }),
        tx.electronicInvoiceBillingModelCatalog.createMany({
          data: billingModel,
          skipDuplicates: true,
        }),
        tx.electronicInvoiceTransmissionTypeCatalog.createMany({
          data: transmissionType,
          skipDuplicates: true,
        }),
        tx.electronicInvoiceContingencyTypeCatalog.createMany({
          data: contingencyType,
          skipDuplicates: true,
        }),
        tx.electronicInvoiceEstablishmentTypeCatalog.createMany({
          data: establishmentType,
          skipDuplicates: true,
        }),
        tx.electronicInvoiceItemTypeCatalog.createMany({
          data: itemType,
          skipDuplicates: true,
        }),
        tx.electronicInvoiceUnitOfMeasureCatalog.createMany({
          data: unitOfMeasure,
          skipDuplicates: true,
        }),
        tx.electronicInvoiceTributeCatalog.createMany({
          data: tribute,
          skipDuplicates: true,
        }),
        tx.electronicInvoiceOperationConditionCatalog.createMany({
          data: operationCondition,
          skipDuplicates: true,
        }),
        tx.electronicInvoicePaymentMethodCatalog.createMany({
          data: paymentMethode,
          skipDuplicates: true,
        }),
        tx.electronicInvoicePaymentTermCatalog.createMany({
          data: paymentTerm,
          skipDuplicates: true,
        }),
        tx.electronicInvoiceOtherAssociatedDocumentCatalog.createMany({
          data: otherAssociatedDocument,
          skipDuplicates: true,
        }),
        tx.electronicInvoiceContingencyDocumentTypeCatalog.createMany({
          data: contingencyDocumentType,
          skipDuplicates: true,
        }),
        tx.electronicInvoiceInvalidationTypeCatalog.createMany({
          data: invalidateType,
          skipDuplicates: true,
        }),
      ]);

      const vehicleTypeCount = await seedVehicleTypes(tx.vehicleType);

      return {
        message: 'all catalogs seeded',
        counts: {
          vehicleTypes: vehicleTypeCount,
          departments: departments.length,
          municipalities: municipalities.length,
          districts: districts.length,
          economicActivity: economicActivityResult.count,
          taxDocumentType: taxDocumentTypeResult.count,
          documentType: documentTypeResult.count,
          billingModel: billingModelResult.count,
          transmissionType: transmissionTypeResult.count,
          contingencyType: contingencyTypeResult.count,
          establishmentType: establishmentTypeResult.count,
          itemType: itemTypeResult.count,
          unitOfMeasure: unitOfMeasureResult.count,
          tribute: tributeResult.count,
          operationCondition: operationConditionResult.count,
          paymentMethod: paymentMethodResult.count,
          paymentTerm: paymentTermResult.count,
          otherAssociatedDocument: otherAssociatedDocumentResult.count,
          contingencyDocumentType: contingencyDocumentTypeResult.count,
          invalidationType: invalidationTypeResult.count,
        },
      };
    });
  }
}
