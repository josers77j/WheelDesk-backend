export interface ItemType {
  code: string;
  name: string;
  isActive: boolean;
}

export const itemType: ItemType[] = [
  {
    code: '1',
    name: 'Bienes',
    isActive: true,
  },
  {
    code: '2',
    name: 'Servicios',
    isActive: true,
  },
  {
    code: '3',
    name: 'Ambos (Bienes y Servicios, incluye los dos inherente a los Productos o servicios)',
    isActive: true,
  },
  {
    code: '4',
    name: 'Otros tributos por ítem',
    isActive: true,
  },
];
