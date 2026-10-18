import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import {
  CreateBucketCommand,
  PutBucketCorsCommand,
  S3Client,
} from '@aws-sdk/client-s3';

// Expose the Promise overload to Jest instead of its final callback overload.
const s3Prototype: {
  send(command: Parameters<S3Client['send']>[0]): Promise<object>;
} = S3Client.prototype;

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('Local storage browser downloads', () => {
  afterEach(() => jest.restoreAllMocks());

  function createStorage(endpoint?: string): StorageService {
    return new StorageService(
      new ConfigService({
        AWS_ENDPOINT_URL: endpoint ?? '',
        AWS_REGION: 'us-east-1',
        AWS_ACCESS_KEY_ID: 'test',
        AWS_SECRET_ACCESS_KEY: 'test',
        AWS_S3_BUCKET_IMAGES: 'test-images',
        AWS_S3_BUCKET_DOCS: 'test-docs',
        FRONTEND_BASE_URL: 'http://localhost:4200/',
      }),
    );
  }

  it('signs the attachment filename and a 15-minute lifetime locally without fetching S3', async (): Promise<void> => {
    const url = new URL(
      await createStorage('http://localhost:4566').getDocUrl(
        'reports/temporary/test.zip',
        900,
        'report.zip',
      ),
    );
    expect(url.searchParams.get('response-content-disposition')).toBe(
      'attachment; filename="report.zip"',
    );
    expect(url.searchParams.get('X-Amz-Expires')).toBe('900');
  });

  it('rejects unsafe download filenames before signing', async (): Promise<void> => {
    await expect(
      createStorage().getDocUrl(
        'reports/temporary/test.zip',
        900,
        'bad"\r\nname.zip',
      ),
    ).rejects.toThrow('Nombre de descarga inválido');
  });

  it('builds an AWS object URL without a custom SDK endpoint', async (): Promise<void> => {
    jest.spyOn(s3Prototype, 'send').mockReturnValue(Promise.resolve({}));
    const result = await createStorage().uploadBuffer(
      Buffer.from('image'),
      'products',
    );
    expect(result.url).toBe(
      `https://test-images.s3.us-east-1.amazonaws.com/${result.key}`,
    );
  });

  it('includes the local bucket and encodes key segments without a double slash', async (): Promise<void> => {
    jest.spyOn(s3Prototype, 'send').mockReturnValue(Promise.resolve({}));
    const result = await createStorage('http://localhost:4566/').uploadBuffer(
      Buffer.from('image'),
      'products/llanta nueva#1',
    );
    expect(result.url).toBe(
      `http://localhost:4566/test-images/${result.key.split('/').map(encodeURIComponent).join('/')}`,
    );
  });

  it('allows signed GET/HEAD downloads from the configured frontend on local buckets', async () => {
    const send = jest
      .spyOn(s3Prototype, 'send')
      .mockReturnValue(Promise.resolve({}));
    await createStorage('http://localhost:4566').onModuleInit();
    const commands = send.mock.calls
      .map(([command]) => command)
      .filter((command) => command instanceof PutBucketCorsCommand);
    expect(commands).toHaveLength(2);
    expect(commands.map((command) => command.input)).toEqual(
      ['test-images', 'test-docs'].map((Bucket) => ({
        Bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: ['http://localhost:4200'],
              AllowedMethods: ['GET', 'HEAD'],
              ExposeHeaders: ['Content-Disposition'],
            },
          ],
        },
      })),
    );
  });

  it('does not create buckets when initializing local storage', async (): Promise<void> => {
    const send = jest
      .spyOn(s3Prototype, 'send')
      .mockReturnValue(Promise.resolve({}));

    await createStorage('http://localhost:4566').onModuleInit();

    expect(
      send.mock.calls.filter(
        ([command]) => command instanceof CreateBucketCommand,
      ),
    ).toHaveLength(0);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('does not change CORS on non-local custom endpoints', async () => {
    const send = jest
      .spyOn(s3Prototype, 'send')
      .mockReturnValue(Promise.resolve({}));
    await createStorage('https://storage.example.com').onModuleInit();
    expect(
      send.mock.calls.filter(
        ([command]) => command instanceof PutBucketCorsCommand,
      ),
    ).toHaveLength(0);
  });

  it('does not change AWS-managed buckets without a custom endpoint', async () => {
    const send = jest
      .spyOn(s3Prototype, 'send')
      .mockReturnValue(Promise.resolve({}));
    await createStorage().onModuleInit();
    expect(send).not.toHaveBeenCalled();
  });
});
