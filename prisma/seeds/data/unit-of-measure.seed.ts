export interface UnitOfMeasure {
  code: string;
  name: string;
  isActive: boolean;
}

export const unitOfMeasure: UnitOfMeasure[] = [
  { code: '10', name: 'Hectárea', isActive: true },
  { code: '13', name: 'metro cuadrado', isActive: true },
  { code: '15', name: 'Vara cuadrada', isActive: true },
  { code: '18', name: 'metro cúbico', isActive: true },
  { code: '20', name: 'Barril', isActive: true },
  { code: '22', name: 'Galón', isActive: true },
  { code: '23', name: 'Litro', isActive: true },
  { code: '24', name: 'Botella', isActive: true },
  { code: '26', name: 'Mililitro', isActive: true },
  { code: '30', name: 'Tonelada', isActive: true },
  { code: '32', name: 'Quintal', isActive: true },
  { code: '33', name: 'Arroba', isActive: true },
  { code: '34', name: 'Kilogramo', isActive: true },
  { code: '36', name: 'Libra', isActive: true },
  { code: '37', name: 'Onza troy', isActive: true },
  { code: '38', name: 'Onza', isActive: true },
  { code: '39', name: 'Gramo', isActive: true },
  { code: '40', name: 'Miligramo', isActive: true },
  { code: '42', name: 'Megawatt', isActive: true },
  { code: '43', name: 'Kilowatt', isActive: true },
  { code: '44', name: 'Watt', isActive: true },
  { code: '45', name: 'Megavoltio-amperio', isActive: true },
  { code: '46', name: 'Kilovoltio-amperio', isActive: true },
  { code: '47', name: 'Voltio-amperio', isActive: true },
  { code: '49', name: 'Gigawatt-hora', isActive: true },
  { code: '50', name: 'Megawatt-hora', isActive: true },
  { code: '51', name: 'Kilowatt-hora', isActive: true },
  { code: '52', name: 'Watt-hora', isActive: true },
  { code: '53', name: 'Kilovoltio', isActive: true },
  { code: '54', name: 'Voltio', isActive: true },
  { code: '55', name: 'Millar', isActive: true },
  { code: '56', name: 'Medio millar', isActive: true },
  { code: '57', name: 'Ciento', isActive: true },
  { code: '58', name: 'Docena', isActive: true },
  { code: '59', name: 'Unidad', isActive: true },
  { code: '99', name: 'Otra', isActive: true },
];
