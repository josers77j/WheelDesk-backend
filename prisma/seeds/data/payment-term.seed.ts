export interface PaymentTerm {
  code: string;
  name: string;
  isActive: boolean;
}

export const paymentTerm: PaymentTerm[] = [
  {
    code: '01',
    name: 'Días',
    isActive: true,
  },
  {
    code: '02',
    name: 'Meses',
    isActive: true,
  },
  {
    code: '03',
    name: 'Años',
    isActive: true,
  },
];
