export interface EstablishmentType {
  code: string;
  name: string;
  isActive: boolean;
}

export const establishmentType: EstablishmentType[] = [
  {
    code: '01',
    name: 'Sucursal',
    isActive: true,
  },
  {
    code: '02',
    name: 'Casa Matriz',
    isActive: true,
  },
  {
    code: '04',
    name: 'Bodega',
    isActive: true,
  },
  {
    code: '07',
    name: 'Patio',
    isActive: true,
  },
];
