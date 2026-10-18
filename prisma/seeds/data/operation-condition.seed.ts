export interface OperationCondition {
  code: string;
  name: string;
  isActive: boolean;
}

export const operationCondition: OperationCondition[] = [
  {
    code: '1',
    name: 'Contado',
    isActive: true,
  },
  {
    code: '2',
    name: 'A crédito',
    isActive: true,
  },
  {
    code: '3',
    name: 'Otro',
    isActive: true,
  },
];
