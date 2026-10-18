export interface OtherAssociatedDocument {
  code: string;
  name: string;
  isActive: boolean;
}

export const otherAssociatedDocument: OtherAssociatedDocument[] = [
  {
    code: '1',
    name: 'Emisor',
    isActive: true,
  },
  {
    code: '2',
    name: 'Receptor',
    isActive: true,
  },
  {
    code: '3',
    name: 'Médico (solo aplica para contribuyentes obligados a la presentación de F-958)',
    isActive: true,
  },
  {
    code: '4',
    name: 'Transporte (solo aplica para Factura de exportación)',
    isActive: true,
  },
];
