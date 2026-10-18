import type { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '../../../prisma/generated/prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

const buildHost = () => {
  const status = jest.fn().mockReturnThis();
  const json = jest.fn();
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status, json }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
};

describe('PrismaExceptionFilter (temp validation)', () => {
  it('PrismaClientValidationError → 500 "Consultar con soporte"', () => {
    const filter = new PrismaExceptionFilter();
    const { host, status, json } = buildHost();

    filter.catch(
      new Prisma.PrismaClientValidationError(
        'Argument `taxDocumentNumber` is missing.',
        { clientVersion: '6.17.1' },
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Consultar con soporte',
      error: 'PrismaException',
    });
  });

  it('P-code desconocido → "Consultar con soporte"', () => {
    const filter = new PrismaExceptionFilter();
    const { host, status, json } = buildHost();

    filter.catch(
      new Prisma.PrismaClientKnownRequestError('raw db error', {
        code: 'P9999',
        clientVersion: '6',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Consultar con soporte',
      error: 'PrismaException',
      code: 'P9999',
    });
  });

  it('P2002 → 409 mensaje claro intacto', () => {
    const filter = new PrismaExceptionFilter();
    const { host, status, json } = buildHost();

    filter.catch(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6',
        meta: { target: ['name'] },
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      message: 'Campos duplicados: name',
      error: 'PrismaException',
      code: 'P2002',
    });
  });
});
