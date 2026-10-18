export interface TaxDocumentType {
  code: string;
  name: string;
  isActive: boolean;
}

export const taxDocumentType: TaxDocumentType[] = [
  {
    code: '36',
    name: 'NIT',
    isActive: true,
  },
  {
    code: '13',
    name: 'DUI',
    isActive: true,
  },
  {
    code: '37',
    name: 'Otro',
    isActive: true,
  },
  {
    code: '03',
    name: 'Pasaporte',
    isActive: true,
  },
  {
    code: '02',
    name: 'Carnet de Residente',
    isActive: true,
  },
];
