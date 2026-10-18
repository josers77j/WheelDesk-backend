export interface ContingencyType {
  code: string;
  name: string;
  isActive: boolean;
}

export const contingencyType: ContingencyType[] = [
  {
    code: '1',
    name: 'No disponibilidad de sistema del MH',
    isActive: true,
  },
  {
    code: '2',
    name: 'No disponibilidad de sistema del emisor',
    isActive: true,
  },
  {
    code: '3',
    name: 'Falla en el suministro de servicio de Internet del Emisor',
    isActive: true,
  },
  {
    code: '4',
    name: 'Falla en el suministro de servicio de energía eléctrica del emisor que impida la transmisión de los DTE',
    isActive: true,
  },
  {
    code: '5',
    name: 'Otro (deberá digitar un máximo de 500 caracteres explicando el motivo)',
    isActive: true,
  },
];
