import { DateTime } from 'luxon';
import { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { QuotationsService } from '../services/quotations.service';

export type QuotationDocument = Awaited<
  ReturnType<QuotationsService['findOneById']>
>;

export function quotationReport(
  quotation: QuotationDocument,
): TDocumentDefinitions {
  const totals: Content[] = [
    { text: `Subtotal: $${quotation.subtotal.toFixed(2)}`, alignment: 'right' },
    {
      text: `Descuento global: $${quotation.globalDiscount.toFixed(2)}`,
      alignment: 'right',
    },
    { text: `IVA: $${quotation.iva.toFixed(2)}`, alignment: 'right' },
    {
      text: `Total: $${quotation.total.toFixed(2)}`,
      alignment: 'right',
      bold: true,
      fontSize: 14,
      margin: [0, 8, 0, 0],
    },
  ];
  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 45],
    defaultStyle: { font: 'Roboto', fontSize: 10, color: '#243342' },
    info: { title: `Cotización ${quotation.documentNumber}` },
    footer: (page: number, pages: number): Content => ({
      text: `${quotation.documentNumber} | Página ${page} de ${pages}`,
      alignment: 'center',
      fontSize: 8,
      color: '#647180',
      margin: [40, 12, 40, 0],
    }),
    content: [
      { text: 'COTIZACIÓN', fontSize: 22, bold: true, margin: [0, 0, 0, 10] },
      { text: quotation.documentNumber, bold: true },
      {
        text: `Fecha: ${DateTime.fromJSDate(quotation.createdAt).setZone('America/El_Salvador').toFormat('dd/MM/yyyy')}`,
        margin: [0, 3, 0, 16],
      },
      {
        text: `Cliente: ${quotation.customerName || quotation.customer?.name || 'Sin cliente'}`,
      },
      ...(quotation.customerAddress
        ? [
            {
              text: quotation.customerAddress,
              margin: [0, 3, 0, 0],
            } satisfies Content,
          ]
        : []),
      {
        margin: [0, 18, 0, 16],
        layout: 'lightHorizontalLines',
        table: {
          headerRows: 1,
          dontBreakRows: true,
          keepWithHeaderRows: 1,
          widths: ['*', 42, 65, 65],
          body: [
            ['Descripción', 'Cantidad', 'Precio unitario', 'Subtotal'].map(
              (text): Content => ({ text, bold: true, fillColor: '#eef1f4' }),
            ),
            ...quotation.details.map((item): Content[] => [
              { text: item.productName },
              { text: String(item.quantity), alignment: 'right' },
              { text: `$${item.unitPrice.toFixed(2)}`, alignment: 'right' },
              { text: `$${item.subtotal.toFixed(2)}`, alignment: 'right' },
            ]),
          ],
        },
      },
      { stack: totals, unbreakable: true },
      ...(quotation.notes
        ? [
            {
              text: 'Observaciones',
              bold: true,
              margin: [0, 20, 0, 6],
            } satisfies Content,
            { text: quotation.notes } satisfies Content,
          ]
        : []),
    ],
  };
}
