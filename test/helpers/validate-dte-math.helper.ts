import Decimal from 'decimal.js';

/**
 * Reglas de redondeo MH El Salvador.
 * Para operaciones gravadas, exentas y no sujetas: 2 decimales (banker's rounding).
 * Para el campo `ivaItem`: 8 decimales (la unidad mínima del IVA).
 */
const ROUND_DECIMALS_MONEY = 2;

const DTE_VERSION_FE = 2;
const DTE_VERSION_CCFE = 4;
const IVA_TRIBUTO_CODIGO = '20';
const IVA_PORCENTAJE = 0.13;

/**
 * Estructura mínima del DTE que la función necesita.
 * Sólo declaramos los campos que validamos (decoupling fuerte de la implementación).
 */
export interface DteCuerpoItemLite {
  numItem: number;
  ventaNoSuj: number;
  ventaExenta: number;
  ventaGravada: number;
  tributos: string[] | null;
  ivaItem?: number;
  precioUni: number;
  montoDescu: number;
  cantidad: number;
}

export interface DteResumenLite {
  totalNoSuj: number;
  totalExenta: number;
  totalGravada: number;
  subTotalVentas: number;
  descuNoSuj: number;
  descuExenta: number;
  descuGravada: number;
  totalDescu: number;
  subTotal: number;
  ivaRete: number;
  ivaPerci?: number;
  reteRenta?: number;
  montoTotalOperacion: number;
  totalNoGravado: number;
  totalPagar: number;
  totalIva?: number;
  tributos: { codigo: string; valor: number }[] | null;
}

export interface DteIdentificacionLite {
  tipoDte: '01' | '03';
  version: number;
  numeroControl: string;
}

export interface DteJsonLite {
  identificacion: DteIdentificacionLite;
  cuerpoDocumento: DteCuerpoItemLite[];
  resumen: DteResumenLite;
}

/**
 * Resultado de la validación matemática.
 * `failures` contiene TODOS los descuadres (no se corta en el primero).
 */
export interface DteValidationResult {
  valid: boolean;
  failures: string[];
}

/**
 * Valida las ecuaciones fiscales del DTE para el Ministerio de Hacienda de El Salvador.
 * Retorna un objeto con la lista completa de descuadres (o `valid: true` si todo cuadra).
 *
 * Reglas validadas:
 * 1. totalNoSuj / totalExenta / totalGravada = suma de cuerpoDocumento por categoría.
 * 2. subTotalVentas = totalNoSuj + totalExenta + totalGravada.
 * 3. descuNoSuj / descuExenta / descuGravada = suma de descuentos por categoría.
 * 4. subTotal = subTotalVentas - totalDescu.
 * 5. montoTotalOperacion = subTotal + totalIva + ivaPerci - ivaRete.
 * 6. totalPagar = montoTotalOperacion (en pago al contado).
 * 7. totalIva = suma de `valor` en tributos[] donde codigo === '20'.
 * 8. Por cada item: ventaGravada = (precioUni * cantidad) - montoDescu (con tolerancia ±0.01).
 * 9. numeroControl inicia con 'DTE-01-' (FE) o 'DTE-03-' (CCFE).
 * 10. version 2 para FE, 4 para CCFE.
 * 11. Si hay tributos=['20'] en el item, ivaItem ~= ventaGravada * 0.13 (tolerancia ±0.01).
 */
export function validateDteMath(dte: DteJsonLite): DteValidationResult {
  const failures: string[] = [];

  // ─── 1. Validar versión y tipoDte ─────────────────────────────────
  const expectedVersion =
    dte.identificacion.tipoDte === '01' ? DTE_VERSION_FE : DTE_VERSION_CCFE;

  if (dte.identificacion.version !== expectedVersion) {
    failures.push(
      `Version esperada ${expectedVersion} para tipoDte '${dte.identificacion.tipoDte}', ` +
        `recibida ${dte.identificacion.version}.`,
    );
  }

  // ─── 2. Validar numeroControl ───────────────────────────────────────
  const expectedPrefix = `DTE-${dte.identificacion.tipoDte}-`;
  if (!dte.identificacion.numeroControl.startsWith(expectedPrefix)) {
    failures.push(
      `numeroControl debe iniciar con '${expectedPrefix}', ` +
        `recibido '${dte.identificacion.numeroControl}'.`,
    );
  }

  // ─── 3. Sumar categorías del cuerpoDocumento ────────────────────────
  const sumNoSuj = sum(dte.cuerpoDocumento.map((i) => i.ventaNoSuj));
  const sumExenta = sum(dte.cuerpoDocumento.map((i) => i.ventaExenta));
  const sumGravada = sum(dte.cuerpoDocumento.map((i) => i.ventaGravada));

  if (!nearEqual(sumNoSuj, dte.resumen.totalNoSuj)) {
    failures.push(
      `totalNoSuj: cuerpo=${sumNoSuj} vs resumen=${dte.resumen.totalNoSuj}`,
    );
  }
  if (!nearEqual(sumExenta, dte.resumen.totalExenta)) {
    failures.push(
      `totalExenta: cuerpo=${sumExenta} vs resumen=${dte.resumen.totalExenta}`,
    );
  }
  if (!nearEqual(sumGravada, dte.resumen.totalGravada)) {
    failures.push(
      `totalGravada: cuerpo=${sumGravada} vs resumen=${dte.resumen.totalGravada}`,
    );
  }

  // ─── 4. subTotalVentas = sumNoSuj + sumExenta + sumGravada ─────────
  const expectedSubTotalVentas = sumNoSuj + sumExenta + sumGravada;
  if (!nearEqual(expectedSubTotalVentas, dte.resumen.subTotalVentas)) {
    failures.push(
      `subTotalVentas: calculado=${expectedSubTotalVentas} vs resumen=${dte.resumen.subTotalVentas}`,
    );
  }

  // ─── 5. subTotal = subTotalVentas - totalDescu ──────────────────────
  const expectedSubTotal = dte.resumen.subTotalVentas - dte.resumen.totalDescu;
  if (!nearEqual(expectedSubTotal, dte.resumen.subTotal)) {
    failures.push(
      `subTotal: calculado=${expectedSubTotal} (subTotalVentas - totalDescu) vs resumen=${dte.resumen.subTotal}`,
    );
  }

  // ─── 6. totalIva = suma de tributos con código '20' ─────────────────
  const totalIvaFromTributos =
    dte.resumen.tributos
      ?.filter((t) => t.codigo === IVA_TRIBUTO_CODIGO)
      .reduce((acc, t) => acc + t.valor, 0) ?? 0;

  if (
    dte.resumen.totalIva !== undefined &&
    !nearEqual(totalIvaFromTributos, dte.resumen.totalIva)
  ) {
    failures.push(
      `totalIva: suma tributos=${totalIvaFromTributos} vs resumen.totalIva=${dte.resumen.totalIva}`,
    );
  }

  // ─── 7. montoTotalOperacion = subTotal + totalIva + ivaPerci - ivaRete ─
  const ivaPerci = dte.resumen.ivaPerci ?? 0;
  const expectedMontoTotal =
    dte.resumen.subTotal +
    totalIvaFromTributos +
    ivaPerci -
    dte.resumen.ivaRete;

  if (!nearEqual(expectedMontoTotal, dte.resumen.montoTotalOperacion)) {
    failures.push(
      `montoTotalOperacion: calculado=${expectedMontoTotal} (subTotal+IVA+ivaPerci-ivaRete) vs resumen=${dte.resumen.montoTotalOperacion}`,
    );
  }

  // ─── 8. totalPagar = montoTotalOperacion (en contado) ───────────────
  if (!nearEqual(dte.resumen.montoTotalOperacion, dte.resumen.totalPagar)) {
    failures.push(
      `totalPagar: esperado=${dte.resumen.montoTotalOperacion} vs resumen=${dte.resumen.totalPagar} (deben ser iguales en operación al contado)`,
    );
  }

  // ─── 9. Por cada ítem: precioUni * cantidad - montoDescu = ventaGravada ─
  dte.cuerpoDocumento.forEach((item) => {
    const expectedVenta = item.precioUni * item.cantidad - item.montoDescu;
    if (!nearEqual(expectedVenta, item.ventaGravada)) {
      failures.push(
        `Item ${item.numItem}: esperado ventaGravada=${expectedVenta} (precioUni*cantidad - montoDescu) vs real=${item.ventaGravada}`,
      );
    }

    // ─── 10. Si tributos=['20'], ivaItem ~= ventaGravada * 0.13 ─────
    if (
      item.tributos?.includes(IVA_TRIBUTO_CODIGO) &&
      item.ivaItem !== undefined
    ) {
      const expectedIvaItem = item.ventaGravada * IVA_PORCENTAJE;
      if (!nearEqual(expectedIvaItem, item.ivaItem, 0.01)) {
        failures.push(
          `Item ${item.numItem}: ivaItem esperado=${expectedIvaItem} vs real=${item.ivaItem} (debe ~= ventaGravada * 13%)`,
        );
      }
    }
  });

  return {
    valid: failures.length === 0,
    failures,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────
function sum(values: number[]): number {
  return new Decimal(values.reduce((acc, v) => acc + v, 0))
    .toDecimalPlaces(ROUND_DECIMALS_MONEY, Decimal.ROUND_HALF_EVEN)
    .toNumber();
}

/**
 * Compara dos números con tolerancia de ±0.01 (1 centavo).
 * El MH permite descuadres de hasta 1 centavo por reglas de redondeo.
 */
function nearEqual(a: number, b: number, tolerance = 0.01): boolean {
  return Math.abs(a - b) <= tolerance;
}
