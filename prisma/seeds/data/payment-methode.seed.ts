export interface PaymentMethode {
  code: string;
  name: string;
  isActive: boolean;
}

export const paymentMethode: PaymentMethode[] = [
  {
    code: '01',
    name: 'Billetes y monedas',
    isActive: true,
  },
  {
    code: '02',
    name: 'Tarjeta Débito',
    isActive: true,
  },
  {
    code: '03',
    name: 'Tarjeta Crédito',
    isActive: true,
  },
  {
    code: '04',
    name: 'Cheque',
    isActive: true,
  },
  {
    code: '05',
    name: 'Transferencia-Depósito Bancario',
    isActive: true,
  },
  {
    code: '08',
    name: 'Dinero electrónico',
    isActive: true,
  },
  {
    code: '09',
    name: 'Monedero electrónico',
    isActive: true,
  },

  {
    code: '11',
    name: 'Bitcoin',
    isActive: true,
  },
  {
    code: '12',
    name: 'Otras Criptomonedas',
    isActive: true,
  },
  {
    code: '13',
    name: 'Cuentas por pagar del receptor',
    isActive: true,
  },
  {
    code: '14',
    name: 'Giro bancario',
    isActive: true,
  },
  {
    code: '99',
    name: 'Otros (se debe indicar el medio de pago)',
    isActive: true,
  },
];
