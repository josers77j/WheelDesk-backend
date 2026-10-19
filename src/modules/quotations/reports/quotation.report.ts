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
    district?: { municipality: { name: string } } | null;
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
  const labelled = (label: string, value: string): ContentText => ({
    text: [{ text: label + ': ', bold: true }, { text: value }],
  });
  const labelCell = (label: string, value: string): ContentText => ({
    ...labelled(label, value),
    margin: [3, 4, 3, 4],
  });
  const blank = '—';
  const rows: Content[][] = quotation.details.map((item, index): Content[] => [
    cell(String(index + 1)),
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
    { ...labelled('Subtotal', money(quotation.subtotal)), alignment: 'right' },
    {
      ...labelled('Descuento global', money(quotation.globalDiscount)),
      alignment: 'right',
    },
    { ...labelled('IVA', money(quotation.iva)), alignment: 'right' },
    {
      ...labelled('Total', money(quotation.total)),
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
                  { text: company?.district?.municipality.name || blank },
                  labelled('Tel.', company?.phone || blank),
                  labelled('Correo', company?.email || blank),
                ],
                alignment: 'center',
                margin: [8, 12, 8, 12],
              },
              {
                stack: [
                  {
                    text:
                      quotation.saleType === 'TAX_CREDIT'
                        ? 'Comprobante de crédito fiscal'
                        : 'Consumidor final',
                    bold: true,
                    fontSize: 11,
                  },
                  {
                    text: quotation.documentNumber,
                    color: '#b91c1c',
                    fontSize: 15,
                    margin: [0, 14, 0, 12],
                  },
                  labelled('Registro No.', company?.nrc || blank),
                  {
                    ...labelled('NIT', company?.nit || blank),
                    margin: [0, 4, 0, 0],
                  },
                ],
                alignment: 'center',
                margin: [8, 12, 8, 12],
              },
            ],
          ],
        },
        margin: [0, 0, 0, 8],
      },
      {
        layout: 'noBorders',
        table: {
          widths: ['*', '*'],
          body: [
            [
              labelCell(
                'Fecha',
                `${DateTime.fromJSDate(quotation.createdAt).setZone('America/El_Salvador').toFormat('dd/MM/yyyy')}`,
              ),
              labelCell('Registro No.', customer?.taxInfo?.nrc || blank),
            ],
            [
              labelCell(
                'Señor',
                quotation.customerName ||
                  quotation.customer?.name ||
                  'Sin cliente',
              ),
              labelCell(
                'Documento',
                customer?.taxInfo?.taxDocumentNumber || blank,
              ),
            ],
            [
              labelCell('Dirección', quotation.customerAddress || blank),
              labelCell(
                'Giro',
                customer?.taxInfo?.economicActivity.name || blank,
              ),
            ],
            [
              labelCell(
                'Municipio',
                customer?.district?.municipality.name || blank,
              ),
              labelCell('Condiciones de pago', blank),
            ],
            [
              labelCell(
                'Departamento',
                customer?.district?.municipality.department.name || blank,
              ),
              labelCell('Nota de remisión', blank),
            ],
          ],
        },
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          keepWithHeaderRows: 1,
          widths: [18, 32, '*', 55, 50, 50, 60],
          body: [
            [
              '#',
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
        margin: [0, 0, 0, 8],
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
                  labelCell('Nombre', '__________________________'),
                  labelCell('Documento', '_______________________'),
                  labelCell('Firma', '___________________________'),
                  {
                    text: 'Entregado por',
                    alignment: 'center',
                    margin: [0, 4, 0, 4],
                  },
                ],
              },
              {
                stack: [
                  labelCell('Nombre', '__________________________'),
                  labelCell('Documento', '_______________________'),
                  labelCell('Firma', '___________________________'),
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
        margin: [0, 8, 0, 0],
        unbreakable: true,
      },
    ],
  };
}
