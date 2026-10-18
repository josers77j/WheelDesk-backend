import { of, firstValueFrom } from 'rxjs';
import { ExecutionContext } from '@nestjs/common';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';

function contextFor(method: string, path = '/api/test') {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method, path }),
    }),
  } as unknown as ExecutionContext;
}

describe('ResponseEnvelopeInterceptor', () => {
  const interceptor = new ResponseEnvelopeInterceptor();

  it('envuelve respuestas GET no paginadas con data', async () => {
    const result = await firstValueFrom(
      interceptor.intercept(contextFor('GET'), {
        handle: () => of({ id: 1 }),
      }),
    );

    expect(result).toEqual({ data: { id: 1 } });
  });

  it('mantiene respuestas paginadas sin modificarlas', async () => {
    const body = { data: [{ id: 1 }], meta: { total: 1 } };
    const result = await firstValueFrom(
      interceptor.intercept(contextFor('GET'), { handle: () => of(body) }),
    );

    expect(result).toEqual(body);
  });

  it('agrega message a create y update', async () => {
    const create = await firstValueFrom(
      interceptor.intercept(contextFor('POST'), {
        handle: () => of({ id: 1 }),
      }),
    );
    const update = await firstValueFrom(
      interceptor.intercept(contextFor('PATCH'), {
        handle: () => of({ id: 1 }),
      }),
    );

    expect(create).toEqual({
      data: { id: 1 },
      message: 'Operación completada correctamente',
    });
    expect(update).toEqual({
      data: { id: 1 },
      message: 'Operación completada correctamente',
    });
  });

  it('respeta el mensaje de negocio si ya existe', async () => {
    const result = await firstValueFrom(
      interceptor.intercept(contextFor('POST'), {
        handle: () => of({ id: 1, message: 'Factura creada con éxito' }),
      }),
    );

    expect(result).toEqual({
      data: { id: 1, message: 'Factura creada con éxito' },
      message: 'Factura creada con éxito',
    });
  });

  it('agrega message a delete y conserva envelopes existentes', async () => {
    const deleted = await firstValueFrom(
      interceptor.intercept(contextFor('DELETE'), {
        handle: () => of(null),
      }),
    );
    const existing = { data: { id: 1 }, message: 'Ya estaba eliminado' };
    const preserved = await firstValueFrom(
      interceptor.intercept(contextFor('DELETE'), {
        handle: () => of(existing),
      }),
    );

    expect(deleted).toEqual({
      data: null,
      message: 'Operación completada correctamente',
    });
    expect(preserved).toEqual(existing);
  });
});

const actionCases = [
  ['POST', '/api/auth/login', 'Sesión iniciada correctamente'],
  ['POST', '/api/auth/refresh-session', 'Sesión renovada correctamente'],
  ['POST', '/api/brand', 'Marca creada correctamente'],
  ['PATCH', '/api/customers/1', 'Cliente actualizado correctamente'],
  ['DELETE', '/api/providers/1', 'Proveedor eliminado correctamente'],
  ['POST', '/api/products/create-tire', 'Llanta creada correctamente'],
  [
    'PATCH',
    '/api/products/update-service/1',
    'Servicio actualizado correctamente',
  ],
  [
    'POST',
    '/api/purchase-orders/approve-order/1',
    'Orden de compra aprobada correctamente',
  ],
  [
    'DELETE',
    '/api/purchase-orders/reject-order/1',
    'Orden de compra rechazada correctamente',
  ],
  [
    'DELETE',
    '/api/users/revoke-sessions/1',
    'Sesiones revocadas correctamente',
  ],
  [
    'DELETE',
    '/api/users/login-locks/1',
    'Bloqueos de acceso eliminados correctamente',
  ],
  [
    'PATCH',
    '/api/users/reset-password/1',
    'Contraseña restablecida correctamente',
  ],
  [
    'POST',
    '/api/quotations/preview',
    'Vista previa de la cotización calculada correctamente',
  ],
  ['POST', '/api/sale-orders/1/email', 'Correo enviado correctamente'],
  [
    'POST',
    '/api/sale-orders/1/documents',
    'Documentos adjuntados correctamente',
  ],
  ['POST', '/api/migration/unlock', 'Acceso a la importación habilitado'],
  [
    'POST',
    '/api/migration/invoices/preview',
    'Archivos analizados correctamente',
  ],
  [
    'POST',
    '/api/migration/invoices/import',
    'Procesamiento del lote finalizado; revisa el resumen y los posibles errores',
  ],
];

describe('Contextual success messages', () => {
  const interceptor = new ResponseEnvelopeInterceptor();
  for (const [method, path, message] of actionCases) {
    it(`${method} ${path} describes the action`, async () => {
      const result = await firstValueFrom(
        interceptor.intercept(contextFor(method, path), {
          handle: () => of({ id: 1 }),
        }),
      );
      expect(result).toEqual({ data: { id: 1 }, message });
    });
  }
  it('adds a contextual message to an existing envelope', async () => {
    const result = await firstValueFrom(
      interceptor.intercept(contextFor('POST', '/api/auth/login'), {
        handle: () => of({ data: { payload: { id: 1 } } }),
      }),
    );
    expect(result).toEqual({
      data: { payload: { id: 1 } },
      message: 'Sesión iniciada correctamente',
    });
  });
  it('preserves a partial-success business warning', async () => {
    const message = 'La venta fue creada, pero el correo no pudo enviarse';
    const result = await firstValueFrom(
      interceptor.intercept(contextFor('POST', '/api/sale-orders/checkout'), {
        handle: () => of({ message, id: 1 }),
      }),
    );
    expect(result).toEqual({ data: { message, id: 1 }, message });
  });
});
