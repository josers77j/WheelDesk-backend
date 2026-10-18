export interface InvalidationType {
  code: string;
  name: string;
  isActive: boolean;
}

export const invalidateType: InvalidationType[] = [
  {
    code: '01',
    name: 'Error en la Información del Documento Tributario Electrónico a invalidar.',
    isActive: true,
  },
  {
    code: '02',
    name: 'Rescindir de la operación realizada.',
    isActive: true,
  },
  {
    code: '03',
    name: 'Otro',
    isActive: true,
  },
];
