import Decimal from 'decimal.js';
import { PaymentMethod } from '../dto/create-sale-order.dto';
import {
  PaymentMethodData,
  PaymentMethodResponse,
} from '../interfaces/payment-method-response.interface';
import { UnprocessableEntityException } from '@nestjs/common';

const CASH_METHODE = '01';
const TOLERANCE = Decimal(0.01);

/**
 * Builds the payment method data with the raw amount (what the client paid)
 * and the declared amount (raw minus the cash excess, if any).
 * The excess is only allowed in cash (bills/coins), so it is only subtracted
 * from the cash payment method.
 */
function buildPaymentMethodData(
  paymentMethodRequest: PaymentMethod[],
  excess: Decimal,
): PaymentMethodData[] {
  return paymentMethodRequest.map((methode) => {
    const rawAmount = Decimal(methode.amount);
    let amount = rawAmount;

    if (excess.greaterThan(0) && methode.code === CASH_METHODE) {
      amount = rawAmount.minus(excess);
    }

    return {
      paymentMethodeId: methode.paymentMethodId,
      amount,
      rawAmount,
      code: methode.code,
    };
  });
}

export function PaymentMethodVerify(
  paymentMethodResponse: PaymentMethodResponse[],
  paymentMethodRequest: PaymentMethod[],
  total: Decimal,
): PaymentMethodData[] {
  if (paymentMethodRequest.length !== paymentMethodResponse.length) {
    throw new UnprocessableEntityException(
      'Uno o varios metodos de pagos seleccionados no existen, verifique que los metodos de pago seleccionados sean valores activos o existan',
    );
  }

  const { totalAmountPaid, totalAmountPaidInCash } =
    paymentMethodRequest.reduce(
      (acc, methode) => {
        acc.totalAmountPaid = Decimal(acc.totalAmountPaid).plus(
          Decimal(methode.amount),
        );

        if (methode.code === CASH_METHODE) {
          acc.totalAmountPaidInCash = Decimal(acc.totalAmountPaidInCash).plus(
            Decimal(methode.amount),
          );
        }

        return acc;
      },
      {
        totalAmountPaid: Decimal(0),
        totalAmountPaidInCash: Decimal(0),
      },
    );

  const remaining = total.minus(totalAmountPaid);
  const remainingWithoutCash = total.minus(
    totalAmountPaid.minus(totalAmountPaidInCash),
  );

  const excess = totalAmountPaid.minus(total);

  if (remaining.abs().lessThan(TOLERANCE))
    return buildPaymentMethodData(paymentMethodRequest, Decimal(0));

  if (remaining.greaterThan(0))
    throw new UnprocessableEntityException(
      `El monto de pago del cliente es insuficiente: ${Math.abs(+remaining)}, monto del producto ${+total}`,
    );

  if (remainingWithoutCash.lessThan(0))
    throw new UnprocessableEntityException(
      'El monto que paga el cliente, es superior al total a pagar, verifique los montos y/o metodos de pago',
    );

  return buildPaymentMethodData(paymentMethodRequest, excess);
}
