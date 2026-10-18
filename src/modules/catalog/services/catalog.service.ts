import { CatalogType } from '../types/catalog.type';
import { CatalogRepository } from './../repositories/catalog.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CatalogService {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  create() {
    return 'This action adds a new catalog';
  }

  async findAll(catalog: CatalogType, filter = '') {
    const delegateCatalog = {
      'economic-activity': async () =>
        await this.catalogRepository.findEconomicActivity(filter),
      'tax-document-type': async () =>
        await this.catalogRepository.findTaxDocumentType(filter),
      'document-type': async () =>
        await this.catalogRepository.findDocumentType(filter),
      'billing-model': async () =>
        await this.catalogRepository.findBillingModel(filter),
      'transmission-type': async () =>
        await this.catalogRepository.findTransmissionType(filter),
      'contingency-type': async () =>
        await this.catalogRepository.findContingencyType(filter),
      'establishment-type': async () =>
        await this.catalogRepository.findEstablishmentType(filter),
      'item-type': async () =>
        await this.catalogRepository.findItemType(filter),
      'unit-of-measure': async () =>
        await this.catalogRepository.findUnitOfMeasure(filter),
      tribute: async () => await this.catalogRepository.findTribute(filter),
      'operation-condition': async () =>
        await this.catalogRepository.findOperationCondition(filter),
      'payment-methode': async () =>
        await this.catalogRepository.findPaymentMethode(filter),
      'payment-term': async () =>
        await this.catalogRepository.findPaymentTerm(filter),
      'other-associated-document': async () =>
        await this.catalogRepository.findOtherAssociatedDocument(filter),
      'contingency-document': async () =>
        await this.catalogRepository.findContingencyDocument(filter),
      'invalidation-type': async () =>
        await this.catalogRepository.findInvalidationType(filter),
    } as const;

    const response = await delegateCatalog[catalog]();

    return response;
  }

  findOne(id: number) {
    return `This action returns a #${id} catalog`;
  }

  update(id: number) {
    return `This action updates a #${id} catalog`;
  }

  remove(id: number) {
    return `This action removes a #${id} catalog`;
  }
}
