export interface PreviewItem {
  codigo: string;
  descripcion: string;
  cantidad: number;
  match: 'match' | 'create';
  productId?: number;
}

export interface PreviewFile {
  filename: string;
  hasPdf: boolean;
  version: number | null;
  tipoDte: string | null;
  controlNumber: string | null;
  generationCode: string | null;
  fecEmi: string | null;
  sello: boolean;
  customer: {
    mode: 'generic' | 'match' | 'create';
    key: string;
    customerId?: number;
  };
  items: PreviewItem[];
  unknownCatalogs: {
    itemTypes: string[];
    units: string[];
    payments: string[];
  };
  duplicate: boolean;
  errors: string[];
}

export interface RawItem {
  codigo?: unknown;
  descripcion?: unknown;
  cantidad?: unknown;
  tipoItem?: unknown;
  uniMedida?: unknown;
}

export interface RawDte {
  identificacion?: {
    version?: unknown;
    tipoDte?: unknown;
    numeroControl?: unknown;
    codigoGeneracion?: unknown;
    fecEmi?: unknown;
  };
  receptor?: {
    nit?: unknown;
    nombre?: unknown;
  } | null;
  cuerpoDocumento?: RawItem[];
  resumen?: {
    pagos?: { codigo?: unknown }[];
  };
  selloRecibido?: unknown;
}
