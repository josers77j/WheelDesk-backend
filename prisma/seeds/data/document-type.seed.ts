export interface DocumentType {
  code: string;
  name: string;
  isActive: boolean;
}
export const documentType: DocumentType[] = [
  { code: '01', name: 'Factura', isActive: true },
  { code: '03', name: 'Comprobante de crédito fiscal', isActive: true },
  { code: '04', name: 'Nota de remisión', isActive: true },
  { code: '05', name: 'Nota de crédito', isActive: true },
  { code: '06', name: 'Nota de débito', isActive: true },
  { code: '07', name: 'Comprobante de retención', isActive: true },
  { code: '08', name: 'Comprobante de liquidación', isActive: true },
  { code: '09', name: 'Documento contable de liquidación', isActive: true },
  { code: '11', name: 'Facturas de exportación', isActive: true },
  { code: '14', name: 'Factura de sujeto excluido', isActive: true },
  { code: '15', name: 'Comprobante de donación', isActive: true },
];
