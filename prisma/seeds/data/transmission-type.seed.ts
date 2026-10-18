export interface TransmissionType {
  code: string;
  name: string;
  isActive: boolean;
}

export const transmissionType: TransmissionType[] = [
  {
    code: '1',
    name: 'Transmisión normal',
    isActive: true,
  },
  {
    code: '2',
    name: 'Transmisión por contingencia',
    isActive: true,
  },
];
