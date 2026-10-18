import { UnprocessableEntityException } from '@nestjs/common';

export interface CustomerWithTaxAndLocationResponse {
  id: number;
  name: string;
  isTaxPayer: boolean;
  email: string | null;
  phone: string | null;
  customerType: string;
  districtId: number | null;
  address: string | null;
  createdById: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  // Relaciones extraídas
  district: {
    id: number;
    name: string;
    code: string;
    agentCode: string | null;
    municipality: {
      id: number;
      name: string;
      code: string;
      externalCode: string;
      department: {
        id: number;
        name: string;
        code: string;
        externalCode: string;
      };
    };
  } | null;

  taxInfo: {
    id: number;
    tradeName: string | null;
    customerId: number;
    taxDocumentTypeId: number;
    taxDocumentNumber: string;
    nrc: string | null;
    economicActivityId: number;
    createdAt: Date;
    updatedAt: Date;
    economicActivity: {
      id: number;
      code: string | null;
      name: string;
      isActive: boolean;
    };
    taxDocumentType: {
      id: number;
      code: string;
      name: string;
      isActive: boolean;
    };
  } | null;
}

export function customerValidations(
  customer?: CustomerWithTaxAndLocationResponse,
) {
  if (!customer)
    throw new UnprocessableEntityException(
      'Es necesario asignar a un cliente contribuyente para este tipo de facturas',
    );

  if (!customer.isTaxPayer)
    throw new UnprocessableEntityException(
      'El cliente seleccionado no es contribuyente',
    );

  if (!customer.taxInfo || Object.keys(customer.taxInfo ?? 0).length === 0)
    throw new UnprocessableEntityException(
      'Informacion de cliente incompleta, necesita informacion de contribuyente para poder continuar',
    );

  const customerEconomicActivityCode = customer.taxInfo?.economicActivity.code;

  const customerNrc = customer.taxInfo.nrc?.trim();

  const customerDocumentNumber = customer.taxInfo.taxDocumentNumber.trim();

  if (!customerEconomicActivityCode)
    throw new UnprocessableEntityException(
      'Codigo de actividad economica de cliente incorrecta o inexistente, verifique el codigo de actividad economica del cliente e intente nuevamente',
    );

  if (!customerNrc || Number.isNaN(Number(customerNrc)))
    throw new UnprocessableEntityException(
      'El NRC del cliente es invalido, verifique que cumpla el formato con valores numericos',
    );

  if (!customerDocumentNumber || Number.isNaN(Number(customerDocumentNumber)))
    throw new UnprocessableEntityException(
      'El Numero de documento (DUI, NIT, etc...) del cliente es invalido, verifique que cumpla el formato con valores numericos',
    );
}
