export interface BillingModel {
  code: string;
  name: string;
  isActive: boolean;
}

export const billingModel: BillingModel[] = [
  {
    code: '1',
    name: 'Modelo Facturación previo',
    isActive: true,
  },
  {
    code: '2',
    name: 'Modelo Facturación diferido',
    isActive: true,
  },
];
