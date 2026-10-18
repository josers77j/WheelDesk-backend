import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../../prisma/generated/prisma/client';
import { Response } from 'express';
import { isRecord } from '../utils/type-guards.util';

// Raw Prisma payloads (validation errors, unknown codes, engine panics) leak
// internals in English; the client gets a generic support message while the
// full exception is logged for debugging.
const SUPPORT_MESSAGE = 'Consultar con soporte';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientRustPanicError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError
      | Prisma.PrismaClientUnknownRequestError
      | Prisma.PrismaClientRustPanicError,
    host: ArgumentsHost,
  ) {
    const logger = new Logger('ExceptionFilter');
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    logger.error(exception);

    if (!(exception instanceof Prisma.PrismaClientKnownRequestError)) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: SUPPORT_MESSAGE,
        error: 'PrismaException',
      });
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = SUPPORT_MESSAGE;
    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const fields = readDuplicateTargets(exception.meta);
        message = `Campos duplicados: ${fields}`;
        break;
      }
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = `Registro no encontrado`;
        break;

      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        const fieldName = readFieldName(exception.meta);
        message = `Referencia de clave foranea incorrecta: ${fieldName}`;
        break;
      }

      case 'P2014': {
        status = HttpStatus.BAD_REQUEST;
        const relation = readRelationField(exception.meta, 'relation_name');
        const modelA = readRelationField(exception.meta, 'model_a_name');
        const modelB = readRelationField(exception.meta, 'model_b_name');
        message =
          modelA && modelB
            ? `La operación viola la relación obligatoria '${relation}' entre '${modelA}' y '${modelB}'`
            : `La operación viola la relación obligatoria '${relation}'`;
        break;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: 'PrismaException',
      code: exception.code,
    });
  }
}

function readDuplicateTargets(meta: unknown): string {
  if (!isRecord(meta)) {
    return 'desconocidos';
  }
  const target: unknown = meta['target'];
  if (typeof target === 'string') {
    return target;
  }
  if (
    Array.isArray(target) &&
    target.every((entry): entry is string => typeof entry === 'string')
  ) {
    return target.join(', ');
  }
  return 'desconocidos';
}

function readFieldName(meta: unknown): string {
  if (!isRecord(meta)) {
    return 'desconocido';
  }
  const fieldName: unknown = meta['field_name'];
  return typeof fieldName === 'string' ? fieldName : 'desconocido';
}

function readRelationField(meta: unknown, field: string): string | undefined {
  if (!isRecord(meta)) {
    return field === 'relation_name' ? 'desconocida' : undefined;
  }
  const value: unknown = meta[field];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return field === 'relation_name' ? 'desconocida' : undefined;
}
