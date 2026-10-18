export interface ContingencyDocumentType {
  code: string;
  name: string;
  isActive: boolean;
}
export const contingencyDocumentType: ContingencyDocumentType[] = [
  {
    code: '01',
    name: 'Factura Electrónico',
    isActive: true,
  },
  {
    code: '03',
    name: 'Comprobante de Crédito Fiscal Electrónico',
    isActive: true,
  },
  {
    code: '04',
    name: 'Nota de Remisión Electrónica',
    isActive: true,
  },
  {
    code: '05',
    name: 'Nota de Crédito Electrónica',
    isActive: true,
  },
  {
    code: '06',
    name: 'Nota de Débito Electrónica',
    isActive: true,
  },
  {
    code: '11',
    name: 'Factura de Exportación Electrónica',
    isActive: true,
  },
  {
    code: '14',
    name: 'Factura de Sujeto Excluido Electrónica',
    isActive: true,
  },
];
