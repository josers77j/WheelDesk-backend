export interface CompanySettings {
  legalName: string;
  tradeName: string;
  nit: string;
  nrc: string;
  registryNo: string;
  address: string;
  EstablishmentMHCode: string;
  salePointMHCode: string;
  districtCode?: string;
  ivaRate: number;
  phone: string;
  email: string;
  externalCode: string;
  establishmentTypeCatalogCode?: string;
  responsableName: string;
  responsableDocNumber: string;
  responsableDocTypeCatalogCode?: string;
}

export const defaultCompanySettings: CompanySettings = {
  legalName: 'Example Administrator',
  tradeName: 'Example Tire Workshop',
  nit: '000000000',
  nrc: '0000000',
  registryNo: '000000-0',
  address: 'Example address',
  EstablishmentMHCode: 'M001',
  salePointMHCode: 'P001',
  ivaRate: 0.13,
  districtCode: '120117',
  phone: '00000000',
  email: 'contact@example.com',
  externalCode: '45301',
  establishmentTypeCatalogCode: '02',
  responsableName: 'Example Administrator',
  responsableDocNumber: '000000000',
  responsableDocTypeCatalogCode: '36',
};
