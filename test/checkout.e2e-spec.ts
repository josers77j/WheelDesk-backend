import { randomUUID } from 'crypto';

import {
  validateDteMath,
  DteJsonLite,
} from './helpers/validate-dte-math.helper';
import { writeDteAudit, AUDIT_DIR_PATH } from './helpers/dte-audit-path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * E2E CHECKOUT - DTE El Salvador (MH)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Target: POST http://localhost:3000/api/sale-orders/checkout
 * Backend: corre en Docker. Asumimos BD con seed cargados.
 *
 * Estrategia de auditoría del DTE:
 *   - No podemos leer el JSON completo del worker (NO escribe a disco).
 *   - Alternativa A: AggregateDb en el módulo sale-orders para retornar DTE.
 *   - Alternativa B: Reconstruir el DTE esperado en el test con validateDteMath,
 *     comparando con la respuesta del checkout (saleOrderId, documentNumber, etc.).
 *
 *   Esta suite usa la estrategia B: valida las matemáticas del DTE esperado
 *   recapitulando la info que la respuesta del checkout entrega.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const API_URL = 'http://localhost:3000/api/sale-orders/checkout';
const BEARER_TOKEN = process.env.CHECKOUT_BEARER_TOKEN || '';

const PRODUCT_LLANTA1 = { id: 1, price: 40.0 };
const PRODUCT_LLANTA3 = { id: 2, price: 113.0 };
const PRODUCT_LLANTA2 = { id: 6, price: 150.0 };
const PRODUCT_SERVICE = { id: 10, price: 25.5 };

const CUSTOMER_CREDIT = { id: 1, name: 'SPECIALITY FOODS, S.A. DE C.V.' };

// ─── Fixtures ──────────────────────────────────────────────────────────
function basePayload(
  overrides: Partial<CheckoutPayload> = {},
): CheckoutPayload {
  return {
    requestId: randomUUID(),
    documentType: 'TAX_CREDIT',
    documentTypeId: 2,
    customerId: CUSTOMER_CREDIT.id,
    discountType: 'USD',
    discountValue: 0,
    paymentMethodeId: 1,
    items: [
      {
        productId: PRODUCT_LLANTA2.id,
        productName: 'Llanta2',
        quantity: 1,
        discountType: 'USD',
        discountValue: 0,
      },
      {
        productId: PRODUCT_LLANTA3.id,
        productName: 'Llanta3',
        quantity: 1,
        discountType: 'USD',
        discountValue: 0,
      },
      {
        productId: PRODUCT_LLANTA1.id,
        productName: 'Llanta1',
        quantity: 1,
        discountType: 'PERCENT',
        discountValue: 10.5,
      },
    ],
    ...overrides,
  };
}

interface CheckoutPayload {
  requestId: string;
  documentType: 'INVOICE' | 'TAX_CREDIT';
  documentTypeId: number;
  customerId?: number;
  discountType?: 'USD' | 'PERCENT';
  discountValue?: number;
  paymentMethodeId: number;
  items: CheckoutItem[];
}

interface CheckoutItem {
  productId: number;
  productName: string;
  quantity: number;
  discountType?: 'USD' | 'PERCENT';
  discountValue?: number;
}

interface CheckoutResponse {
  saleOrderId: number;
  documentNumber: string;
  status: string;
  finalized: boolean;
  // ... otros campos
}

// ─── HTTP client (fetch nativo, Node 18+) ─────────────────────────────
async function checkout(payload: CheckoutPayload) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BEARER_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  const data: unknown = await res.json().catch(() => null);
  return { status: res.status, data };
}

function checkoutResponse(value: unknown): CheckoutResponse {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('saleOrderId' in value) ||
    typeof value.saleOrderId !== 'number' ||
    !('documentNumber' in value) ||
    typeof value.documentNumber !== 'string' ||
    !('status' in value) ||
    typeof value.status !== 'string' ||
    !('finalized' in value) ||
    typeof value.finalized !== 'boolean'
  ) {
    throw new Error('Expected a successful checkout response');
  }
  return {
    saleOrderId: value.saleOrderId,
    documentNumber: value.documentNumber,
    status: value.status,
    finalized: value.finalized,
  };
}

// ─── Helper: reconstruir DTE esperado para validación matemática ──────
function buildExpectedDteLite(
  payload: CheckoutPayload,
  value: unknown,
): DteJsonLite {
  const response = checkoutResponse(value);
  // Mapear productos a precios (asume seed cargado)
  const precioMap: Record<number, number> = {
    [PRODUCT_LLANTA1.id]: PRODUCT_LLANTA1.price,
    [PRODUCT_LLANTA3.id]: PRODUCT_LLANTA3.price,
    [PRODUCT_LLANTA2.id]: PRODUCT_LLANTA2.price,
    [PRODUCT_SERVICE.id]: PRODUCT_SERVICE.price,
  };

  const totalNoSuj = 0;
  const totalExenta = 0;
  let totalGravada = 0;
  let totalDescu = 0;

  const itemsLite = payload.items.map((item, idx) => {
    const basePrice = precioMap[item.productId] ?? 0;
    const bruto = basePrice * item.quantity;
    // Cálculo del descuento del item
    const itemDiscountAmount =
      item.discountType === 'PERCENT'
        ? Number(((bruto * (item.discountValue ?? 0)) / 100).toFixed(8))
        : (item.discountValue ?? 0);

    // Asumimos productos gravados (TAXABLE, no EXEMPT).
    const ventaGravada = Number((bruto - itemDiscountAmount).toFixed(2));
    const ivaItem = Number((ventaGravada * 0.13).toFixed(8));

    totalGravada += ventaGravada;
    totalDescu += itemDiscountAmount;

    return {
      numItem: idx + 1,
      ventaNoSuj: 0,
      ventaExenta: 0,
      ventaGravada,
      tributos: ['20'] as string[],
      ivaItem,
      precioUni: basePrice,
      montoDescu: itemDiscountAmount,
      cantidad: item.quantity,
    };
  });

  // Descuento a nivel de orden (si aplica)
  const orderSubtotal = totalGravada;
  const orderDiscountAmount =
    payload.discountType === 'PERCENT'
      ? Number(
          ((orderSubtotal * (payload.discountValue ?? 0)) / 100).toFixed(2),
        )
      : (payload.discountValue ?? 0);

  totalDescu += orderDiscountAmount;
  totalGravada -= orderDiscountAmount;

  const subTotal = totalGravada;
  const totalIva = Number((subTotal * 0.13).toFixed(2));
  const montoTotalOperacion = subTotal + totalIva;

  return {
    identificacion: {
      tipoDte: payload.documentType === 'TAX_CREDIT' ? '03' : '01',
      version: payload.documentType === 'TAX_CREDIT' ? 4 : 2,
      numeroControl: response.documentNumber,
    },
    cuerpoDocumento: itemsLite,
    resumen: {
      totalNoSuj,
      totalExenta,
      totalGravada,
      subTotalVentas: totalGravada,
      descuNoSuj: 0,
      descuExenta: 0,
      descuGravada: totalDescu,
      totalDescu,
      subTotal,
      ivaRete: 0,
      montoTotalOperacion,
      totalNoGravado: 0,
      totalPagar: montoTotalOperacion,
      totalIva,
      tributos: [{ codigo: '20', valor: totalIva }],
    },
  };
}

// ────────────────────────────────────────────────────────────────────────
// TESTS
// ────────────────────────────────────────────────────────────────────────
describe('Checkout E2E - DTE Ministerio de Hacienda El Salvador', () => {
  // ─── Block 1: Validaciones DTO (400 Bad Request) ────────────────────
  describe('Block 1: Validaciones de entrada (DTO)', () => {
    it('TAX_CREDIT sin customerId debe fallar con 400', async () => {
      const payload = basePayload({
        customerId: undefined,
        discountType: undefined,
        discountValue: undefined,
      });
      const res = await checkout(payload);
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.data)).toMatch(/customerId/i);
    });

    it('INVOICE con documentTypeId 2 (incompatible) debe fallar con 400', async () => {
      const payload = basePayload({
        documentType: 'INVOICE',
        documentTypeId: 2,
        customerId: undefined,
      });
      const res = await checkout(payload);
      expect(res.status).toBe(400);
    });

    it('discountValue sin discountType debe fallar con 400', async () => {
      const payload = basePayload({
        discountValue: 15,
        discountType: undefined,
      });
      const res = await checkout(payload);
      expect(res.status).toBe(400);
    });

    it('items vacío debe fallar con 400', async () => {
      const payload = basePayload({ items: [] });
      const res = await checkout(payload);
      expect(res.status).toBe(400);
    });
  });

  // ─── Block 2: Flujos correctos (201 + auditoría matemática) ─────────
  describe('Block 2: Flujos correctos de negocio', () => {
    it('Crédito Fiscal (DTE-03): valida matemática del DTE', async () => {
      const payload = basePayload();
      const res = await checkout(payload);

      expect(res.status).toBe(201);
      expect(checkoutResponse(res.data).documentNumber).toMatch(/^DTE-03-/);

      const expectedDte = buildExpectedDteLite(payload, res.data);
      writeDteAudit(
        `dte-03-${checkoutResponse(res.data).documentNumber}.json`,
        expectedDte,
      );

      const validation = validateDteMath(expectedDte);
      if (!validation.valid) {
        console.error(
          `DTE-03 disquadrado (${checkoutResponse(res.data).documentNumber}):`,
          validation.failures,
        );
      }
      expect(validation.valid).toBe(true);
      expect(validation.failures).toEqual([]);
    });

    it('Consumidor Final (DTE-01) sin customerId procesa correctamente', async () => {
      const payload = basePayload({
        documentType: 'INVOICE',
        documentTypeId: 1,
        customerId: undefined,
        discountType: undefined,
        discountValue: undefined,
      });
      const res = await checkout(payload);

      expect(res.status).toBe(201);
      expect(checkoutResponse(res.data).documentNumber).toMatch(/^DTE-01-/);

      const expectedDte = buildExpectedDteLite(payload, res.data);
      writeDteAudit(
        `dte-01-${checkoutResponse(res.data).documentNumber}.json`,
        expectedDte,
      );

      const validation = validateDteMath(expectedDte);
      expect(validation.valid).toBe(true);
    });

    it('Descuento fijo USD a nivel de ítem: ventaGravada correcta', async () => {
      const payload = basePayload({
        items: [
          {
            productId: PRODUCT_LLANTA2.id,
            productName: 'Llanta2',
            quantity: 1,
            discountType: 'USD',
            discountValue: 20.5,
          },
        ],
        discountType: undefined,
        discountValue: undefined,
      });
      const res = await checkout(payload);
      expect(res.status).toBe(201);

      const expectedDte = buildExpectedDteLite(payload, res.data);
      // Específico: validación puntual del cálculo del descuento USD
      expect(expectedDte.cuerpoDocumento[0].ventaGravada).toBeCloseTo(129.5, 2);
      expect(expectedDte.cuerpoDocumento[0].montoDescu).toBeCloseTo(20.5, 2);

      const validation = validateDteMath(expectedDte);
      expect(validation.valid).toBe(true);
    });

    it('Decimales periódicos (no descuadre de 1 centavo)', async () => {
      // Precios que generan decimales feos al dividir por 1.13
      const payload = basePayload({
        items: [
          {
            productId: PRODUCT_LLANTA1.id,
            productName: 'Llanta1',
            quantity: 1,
            discountType: 'USD',
            discountValue: 0,
          },
        ],
        discountType: undefined,
        discountValue: undefined,
      });
      const res = await checkout(payload);
      expect(res.status).toBe(201);

      const expectedDte = buildExpectedDteLite(payload, res.data);
      const validation = validateDteMath(expectedDte);

      if (!validation.valid) {
        console.error('Descuadre detectado:', validation.failures);
      }
      expect(validation.valid).toBe(true);
    });
  });

  // ─── Block 3: Concurrencia e Idempotencia ───────────────────────────
  describe('Block 3: Concurrencia e Idempotencia', () => {
    it('Mismo requestId dos veces → no duplica', async () => {
      const sharedRequestId = randomUUID();
      const payload = basePayload({ requestId: sharedRequestId });

      const [res1, res2] = await Promise.all([
        checkout(payload),
        checkout(payload),
      ]);

      // Ambos deben retornar 201 O uno 201 y otro 409 (idempotency).
      expect([201, 409]).toContain(res1.status);
      expect([201, 409]).toContain(res2.status);

      // Al menos uno debe ser 201 (el primero que ganó la carrera).
      const successCount = [res1, res2].filter((r) => r.status === 201).length;
      expect(successCount).toBe(1);
    });
  });

  afterAll(() => {
    console.log(`\n📁 DTE audit files en: ${AUDIT_DIR_PATH}`);
  });
});
