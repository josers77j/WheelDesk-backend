import { DateTime } from 'luxon';
import { Content, ContentText, TDocumentDefinitions } from 'pdfmake/interfaces';
import { QuotationsService } from '../services/quotations.service';

export type QuotationDocument = Awaited<
  ReturnType<QuotationsService['findOneById']>
>;

export interface QuotationPrintContext {
  company?: {
    legalName: string;
    tradeName: string | null;
    address: string;
    nit: string;
    nrc: string | null;
    phone: string;
    email: string;
  } | null;
  customer?: {
    taxInfo: {
      taxDocumentNumber: string;
      nrc: string | null;
      economicActivity: { name: string };
    } | null;
    district: {
      municipality: { name: string; department: { name: string } };
    } | null;
  } | null;
}

export function quotationReport(
  quotation: QuotationDocument,
  context: QuotationPrintContext = {},
): TDocumentDefinitions {
  const company = context.company;
  const customer = context.customer;
  const money = (value: { toFixed: (places: number) => string }): string =>
    `$${value.toFixed(2)}`;
  const cell = (text: string, bold = false): ContentText => ({
    text,
    bold,
    margin: [3, 4, 3, 4],
  });
  const blank = '—';
  const rows: Content[][] = quotation.details.map((item): Content[] => [
    cell(String(item.quantity)),
    cell(item.productName),
    { ...cell(money(item.unitPrice)), alignment: 'right' },
    {
      ...cell(
        item.taxType === 'NON_TAXABLE'
          ? money(item.amountAfterDiscount)
          : blank,
      ),
      alignment: 'right',
    },
    {
      ...cell(
        item.taxType === 'EXEMPT' ? money(item.amountAfterDiscount) : blank,
      ),
      alignment: 'right',
    },
    {
      ...cell(
        item.taxType === 'TAXABLE' ? money(item.amountAfterDiscount) : blank,
      ),
      alignment: 'right',
    },
  ]);
  const totals: Content[] = [
    { text: `Subtotal: ${money(quotation.subtotal)}`, alignment: 'right' },
    {
      text: `Descuento global: ${money(quotation.globalDiscount)}`,
      alignment: 'right',
    },
    { text: `IVA: ${money(quotation.iva)}`, alignment: 'right' },
    {
      text: `Total: ${money(quotation.total)}`,
      bold: true,
      fontSize: 12,
      alignment: 'right',
      margin: [0, 6, 0, 0],
    },
  ];
  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 45],
    defaultStyle: { font: 'Roboto', fontSize: 9, color: '#202020' },
    info: { title: `Cotización ${quotation.documentNumber}` },
    footer: (page: number, pages: number): Content => ({
      text: `${quotation.documentNumber} | Página ${page} de ${pages}`,
      alignment: 'center',
      fontSize: 8,
      color: '#666666',
      margin: [40, 12, 40, 0],
    }),
    content: [
      {
        text: 'Cotización',
        alignment: 'center',
        italics: true,
        bold: true,
        fontSize: 16,
        margin: [0, 0, 0, 16],
      },
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              {
                stack: [
                  {
                    text: company?.tradeName || company?.legalName || 'Empresa',
                    bold: true,
                    fontSize: 13,
                    margin: [0, 0, 0, 5],
                  },
                  ...(company?.tradeName &&
                  company.tradeName !== company.legalName
                    ? [{ text: company.legalName }]
                    : []),
                  { text: company?.address || blank, margin: [0, 5, 0, 5] },
                  {
                    text: company
                      ? `Tel.: ${company.phone} | ${company.email}`
                      : blank,
                  },
                ],
                alignment: 'center',
                margin: [8, 12, 8, 12],
              },
              {
                stack: [
                  {
                    text:
                      quotation.saleType === 'TAX_CREDIT'
                        ? 'Cotización — Crédito fiscal'
                        : 'Cotización — Consumidor final',
                    bold: true,
                    fontSize: 11,
                  },
                  {
                    text: quotation.documentNumber,
                    color: '#b91c1c',
                    fontSize: 15,
                    margin: [0, 14, 0, 12],
                  },
                  { text: `Registro No.: ${company?.nrc || blank}` },
                  {
                    text: `NIT: ${company?.nit || blank}`,
                    margin: [0, 4, 0, 0],
                  },
                ],
                alignment: 'center',
                margin: [8, 12, 8, 12],
              },
            ],
          ],
        },
        margin: [0, 0, 0, 0],
      },
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              cell(
                `Fecha: ${DateTime.fromJSDate(quotation.createdAt).setZone('America/El_Salvador').toFormat('dd/MM/yyyy')}`,
              ),
              cell(`Registro No.: ${customer?.taxInfo?.nrc || blank}`),
            ],
            [
              cell(
                `Señor: ${quotation.customerName || quotation.customer?.name || 'Sin cliente'}`,
              ),
              cell(
                `Documento: ${customer?.taxInfo?.taxDocumentNumber || blank}`,
              ),
            ],
            [
              cell(`Dirección: ${quotation.customerAddress || blank}`),
              cell(
                `Giro: ${customer?.taxInfo?.economicActivity.name || blank}`,
              ),
            ],
            [
              cell(
                `Municipio: ${customer?.district?.municipality.name || blank}`,
              ),
              cell('Condiciones de pago: —'),
            ],
            [
              cell(
                `Departamento: ${customer?.district?.municipality.department.name || blank}`,
              ),
              cell('Nota de remisión: —'),
            ],
          ],
        },
        margin: [0, 0, 0, 0],
      },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          keepWithHeaderRows: 1,
          widths: [30, '*', 60, 55, 50, 65],
          body: [
            [
              'Cant.',
              'Descripción',
              'Precio unitario',
              'V. no sujetas',
              'Ventas exentas',
              'Ventas afectadas',
            ].map(
              (text): Content => ({
                ...cell(text, true),
                alignment: 'center',
                fillColor: '#f5f5f5',
              }),
            ),
            ...rows,
          ],
        },
        margin: [0, 0, 0, 0],
      },
      {
        table: {
          widths: ['*', 190],
          body: [
            [
              {
                stack: [
                  { text: 'Observaciones', bold: true, margin: [0, 0, 0, 6] },
                  { text: quotation.notes || blank },
                ],
                margin: [6, 8, 6, 8],
              },
              { stack: totals, margin: [6, 8, 6, 8] },
            ],
          ],
        },
        unbreakable: true,
      },
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              {
                stack: [
                  cell('Nombre: __________________________'),
                  cell('Documento: _______________________'),
                  cell('Firma: ___________________________'),
                  {
                    text: 'Entregado por',
                    alignment: 'center',
                    margin: [0, 4, 0, 4],
                  },
                ],
              },
              {
                stack: [
                  cell('Nombre: __________________________'),
                  cell('Documento: _______________________'),
                  cell('Firma: ___________________________'),
                  {
                    text: 'Recibido por',
                    alignment: 'center',
                    margin: [0, 4, 0, 4],
                  },
                ],
              },
            ],
          ],
        },
        margin: [0, 14, 0, 0],
        unbreakable: true,
      },
      {
        text: 'Cotización. No constituye comprobante fiscal ni reserva de inventario.',
        fontSize: 8,
        color: '#666666',
        margin: [0, 10, 0, 0],
      },
    ],
  };
}
