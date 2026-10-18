interface ResourceMessages {
  created: string;
  updated: string;
  deleted: string;
}

const resources: Readonly<Record<string, ResourceMessages>> = {
  brand: {
    created: 'Marca creada correctamente',
    updated: 'Marca actualizada correctamente',
    deleted: 'Marca eliminada correctamente',
  },
  customers: {
    created: 'Cliente creado correctamente',
    updated: 'Cliente actualizado correctamente',
    deleted: 'Cliente eliminado correctamente',
  },
  providers: {
    created: 'Proveedor creado correctamente',
    updated: 'Proveedor actualizado correctamente',
    deleted: 'Proveedor eliminado correctamente',
  },
  users: {
    created: 'Usuario creado correctamente',
    updated: 'Usuario actualizado correctamente',
    deleted: 'Usuario eliminado correctamente',
  },
  warehouses: {
    created: 'Bodega creada correctamente',
    updated: 'Bodega actualizada correctamente',
    deleted: 'Bodega eliminada correctamente',
  },
  zones: {
    created: 'Zona creada correctamente',
    updated: 'Zona actualizada correctamente',
    deleted: 'Zona eliminada correctamente',
  },
  transfers: {
    created: 'Transferencia creada correctamente',
    updated: 'Transferencia actualizada correctamente',
    deleted: 'Transferencia eliminada correctamente',
  },
  'purchase-orders': {
    created: 'Orden de compra creada correctamente',
    updated: 'Orden de compra actualizada correctamente',
    deleted: 'Orden de compra eliminada correctamente',
  },
  'sale-orders': {
    created: 'Orden de venta creada correctamente',
    updated: 'Orden de venta actualizada correctamente',
    deleted: 'Orden de venta eliminada correctamente',
  },
  quotations: {
    created: 'Cotización creada correctamente',
    updated: 'Cotización actualizada correctamente',
    deleted: 'Cotización eliminada correctamente',
  },
  products: {
    created: 'Producto creado correctamente',
    updated: 'Producto actualizado correctamente',
    deleted: 'Producto eliminado correctamente',
  },
  company: {
    created: 'Configuración de la empresa guardada correctamente',
    updated: 'Configuración de la empresa actualizada correctamente',
    deleted: 'Configuración de la empresa eliminada correctamente',
  },
};

const actions: Readonly<Record<string, string>> = {
  'POST auth/login': 'Sesión iniciada correctamente',
  'POST auth/refresh-session': 'Sesión renovada correctamente',
  'POST auth/logout': 'Sesión cerrada correctamente',
  'PATCH users/reset-password': 'Contraseña restablecida correctamente',
  'DELETE users/revoke-sessions': 'Sesiones revocadas correctamente',
  'DELETE users/login-locks': 'Bloqueos de acceso eliminados correctamente',
  'POST purchase-orders/approve-order':
    'Orden de compra aprobada correctamente',
  'DELETE purchase-orders/reject-order':
    'Orden de compra rechazada correctamente',
  'POST products/create-tire': 'Llanta creada correctamente',
  'POST products/create-supply': 'Insumo creado correctamente',
  'POST products/create-service': 'Servicio creado correctamente',
  'PATCH products/update-tire': 'Llanta actualizada correctamente',
  'PATCH products/update-supply': 'Insumo actualizado correctamente',
  'PATCH products/update-service': 'Servicio actualizado correctamente',
  'POST products/create-product-image':
    'Carga de imágenes procesada; revisa el resultado',
  'DELETE products/delete-product-image': 'Imágenes eliminadas correctamente',
  'POST quotations/preview':
    'Vista previa de la cotización calculada correctamente',
  'POST quotations/email': 'Correo enviado correctamente',
  'POST sale-orders/checkout': 'Orden de venta creada correctamente',
  'POST sale-orders/email': 'Correo enviado correctamente',
  'POST sale-orders/documents': 'Documentos adjuntados correctamente',
  'POST sale-orders/zip': 'Solicitud de descarga preparada correctamente',
  'POST migration/unlock': 'Acceso a la importación habilitado',
  'POST migration/unlock/refresh': 'Acceso a la importación renovado',
  'POST migration/invoices/preview': 'Archivos analizados correctamente',
  'POST migration/invoices/import':
    'Procesamiento del lote finalizado; revisa el resumen y los posibles errores',
};

export function successMessage(method: string, path = ''): string {
  // Express paths include the API prefix; identifiers never select an action.
  const segments = path.split('?')[0].split('/').filter(Boolean);
  if (segments[0] === 'api') segments.shift();
  const resource = segments[0];
  const actionSegments = segments.filter(
    (segment) =>
      !/^\d+$/.test(segment) &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        segment,
      ),
  );
  const actionMessage = actions[`${method} ${actionSegments.join('/')}`];
  if (actionMessage) return actionMessage;
  const messages = resources[resource];
  if (
    messages &&
    (segments.length === 1 ||
      (segments.length === 2 && actionSegments.length === 1))
  ) {
    if (method === 'POST' && segments.length === 1) return messages.created;
    if (method === 'PATCH' || method === 'PUT') return messages.updated;
    if (method === 'DELETE') return messages.deleted;
  }
  return 'Operación completada correctamente';
}
