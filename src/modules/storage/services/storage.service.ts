import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import {
  DeleteObjectsCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  PutBucketCorsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService implements OnModuleInit {
  logger = new Logger('S3-STORAGE');
  private client: S3Client;
  private bucketImages: string;
  private bucketDocs: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('AWS_ENDPOINT_URL');

    this.client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      ...(endpoint && {
        endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId:
            this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.getOrThrow<string>(
            'AWS_SECRET_ACCESS_KEY',
          ),
        },
      }),
    });

    this.bucketImages = this.configService.get('AWS_S3_BUCKET_IMAGES')!;
    this.bucketDocs = this.configService.get('AWS_S3_BUCKET_DOCS')!;
  }

  async onModuleInit(): Promise<void> {
    const endpoint = this.configService.get<string>('AWS_ENDPOINT_URL');
    if (!endpoint) return;
    const isLocalEndpoint = [
      'localhost',
      '127.0.0.1',
      '[::1]',
      'localhost.floci.io',
      'localhost.flocl.io',
    ].includes(new URL(endpoint).hostname);
    const frontendUrl = this.configService.get<string>('FRONTEND_BASE_URL');
    const downloadOrigin =
      isLocalEndpoint && frontendUrl ? new URL(frontendUrl).origin : undefined;

    for (const bucket of [this.bucketImages, this.bucketDocs]) {
      // Signed local downloads still need CORS; AWS bucket policies stay untouched.
      if (downloadOrigin) {
        try {
          await this.client.send(
            new PutBucketCorsCommand({
              Bucket: bucket,
              CORSConfiguration: {
                CORSRules: [
                  {
                    AllowedOrigins: [downloadOrigin],
                    AllowedMethods: ['GET', 'HEAD'],
                    ExposeHeaders: ['Content-Disposition'],
                  },
                ],
              },
            }),
          );
        } catch (error) {
          this.logger.error(error);
        }
      }
    }
  }

  async uploadPurchaseDocument(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<void> {
    const bucket = this.configService.getOrThrow<string>(
      'AWS_S3_BUCKET_PURCHASES',
    );
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
  }

  async deletePurchaseDocument(key: string): Promise<void> {
    const bucket = this.configService.getOrThrow<string>(
      'AWS_S3_BUCKET_PURCHASES',
    );
    await this.client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
  }

  async getPurchaseDocumentBytes(key: string): Promise<Buffer> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.configService.getOrThrow<string>(
            'AWS_S3_BUCKET_PURCHASES',
          ),
          Key: key,
        }),
      );
      if (!response.Body)
        throw new NotFoundException(
          'El documento original no está disponible.',
        );
      const bytes = Buffer.from(await response.Body.transformToByteArray());
      if (bytes.length > 512 * 1024)
        throw new BadRequestException(
          'El documento supera el tamaño permitido de 512 KB.',
        );
      return bytes;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        ['NoSuchKey', 'NotFound'].includes(error.name)
      )
        throw new NotFoundException(
          'El archivo original no se encontró en el almacenamiento.',
        );
      throw error;
    }
  }

  async getPurchaseDocumentUrl(key: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.configService.getOrThrow<string>(
          'AWS_S3_BUCKET_PURCHASES',
        ),
        Key: key,
      }),
      { expiresIn: 900 },
    );
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: string,
  ): Promise<{ url: string; key: string }> {
    const key = `${folder}/${randomUUID()}.webp`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketImages,
        Key: key,
        Body: buffer,
        ContentType: 'image/webp',
      }),
    );

    return {
      key,
      url: await this.imageObjectUrl(key),
    };
  }

  private async imageObjectUrl(key: string): Promise<string> {
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    const endpoint = this.configService.get<string>('AWS_ENDPOINT_URL');
    if (endpoint) {
      return `${endpoint.replace(/\/+$/, '')}/${encodeURIComponent(this.bucketImages)}/${encodedKey}`;
    }
    const region = await this.client.config.region();
    return `https://${this.bucketImages}.s3.${region}.amazonaws.com/${encodedKey}`;
  }

  /** Subida en lote: no falla por un archivo; devuelve las que sí subieron. */
  async uploadBuffers(
    buffers: Buffer[],
    folder: string,
  ): Promise<{ url: string; key: string }[]> {
    const settled = await Promise.allSettled(
      buffers.map((buffer) => this.uploadBuffer(buffer, folder)),
    );
    const uploaded = settled
      .filter(
        (r): r is PromiseFulfilledResult<{ url: string; key: string }> =>
          r.status === 'fulfilled',
      )
      .map((r) => r.value);
    if (uploaded.length === 0 && buffers.length > 0) {
      throw new Error('No se pudo subir ninguna imagen.');
    }
    return uploaded;
  }

  /** Borrado en lote: una sola petición S3 (hasta 1000 keys). */
  async deleteFiles(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    if (keys.length === 1) {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucketImages, Key: keys[0] }),
      );
      return;
    }
    const response = await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucketImages,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      }),
    );
    if (response.Errors?.length) {
      throw new Error(
        `No se pudieron eliminar: ${response.Errors.map((e) => e.Key).join(', ')}`,
      );
    }
  }

  /**
   * Llave de documento: docs/YYYY/MM/DD/<filename> en America/El_Salvador.
   * Sin subcarpeta por generationCode: los PDF y JSON del día conviven.
   */
  buildDocKey(date: Date, filename: string): string {
    const sv = new Date(date.getTime() - 6 * 3_600_000);
    const y = sv.getUTCFullYear();
    const m = String(sv.getUTCMonth() + 1).padStart(2, '0');
    const d = String(sv.getUTCDate()).padStart(2, '0');
    return `docs/${y}/${m}/${d}/${filename}`;
  }

  async uploadDoc(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<{ url: string; key: string }> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketDocs,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return { key, url: await this.getDocUrl(key) };
  }

  async deleteDoc(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucketDocs, Key: key }),
    );
  }

  async docExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucketDocs, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async docLastModified(key: string): Promise<Date | null> {
    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucketDocs, Key: key }),
      );
      return head.LastModified ?? null;
    } catch {
      return null;
    }
  }

  async getDocUrl(
    key: string,
    expiresIn = 3600,
    filename?: string,
  ): Promise<string> {
    if (filename && !/^[a-zA-Z0-9._-]+$/.test(filename))
      throw new BadRequestException('Nombre de descarga inválido.');
    // En Floci/local la pre-firmada apunta al endpoint local y funciona igual.
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucketDocs,
        Key: key,
        ...(filename
          ? { ResponseContentDisposition: `attachment; filename="${filename}"` }
          : {}),
      }),
      { expiresIn },
    );
  }

  /** Baja los bytes de un doc (para ZIPs: reutilizar sin regenerar). */
  async getDocBytes(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucketDocs, Key: key }),
    );
    const body = response.Body;
    if (!body) throw new Error(`Documento vacío: ${key}`);
    if (Buffer.isBuffer(body)) return body;
    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
