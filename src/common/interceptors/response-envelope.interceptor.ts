import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';
import { successMessage } from './success-message.util';

interface ResponseEnvelope<T> {
  data: T;
  message?: string;
}

@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseEnvelope<T> | T> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((body: T) => {
        if (body === undefined) return body;
        if (isPaginatedBody(body) || isEnvelopeBody(body)) {
          return this.withMessageIfNeeded(body, request);
        }
        if (isReadMethod(request.method)) {
          return { data: body };
        }
        return {
          data: body,
          message:
            isRecord(body) && typeof body['message'] === 'string'
              ? body['message']
              : successMessage(request.method, request.path),
        };
      }),
    );
  }

  private withMessageIfNeeded(body: T, request: Request): T {
    if (
      isReadMethod(request.method) ||
      !isEnvelopeBody(body) ||
      (body as ResponseEnvelope<T>).message !== undefined
    ) {
      return body;
    }
    return {
      ...(body as object),
      message: successMessage(request.method, request.path),
    } as T;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPaginatedBody(value: unknown): boolean {
  return isRecord(value) && 'data' in value && 'meta' in value;
}

function isEnvelopeBody(value: unknown): boolean {
  return isRecord(value) && 'data' in value && !('meta' in value);
}

function isReadMethod(method: string): boolean {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method);
}
