import Decimal from 'decimal.js';

export interface PaymentMethodResponse {
  id: number;
  name: string;
  code: string;
}

export interface PaymentMethodData {
  paymentMethodeId: number;
  amount: Decimal;
  rawAmount: Decimal;
  code: string;
}
