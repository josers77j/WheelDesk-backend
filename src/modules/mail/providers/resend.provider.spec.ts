import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ResendProvider } from './resend.provider';
import { Options } from '../interface/mail-provider.interface';

const mockSend = jest.fn<
  Promise<{ data: { id: string } | null; error: { message: string } | null }>,
  [Options]
>();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}));

describe('ResendProvider failure contract', () => {
  let provider: ResendProvider;
  let logSpy: jest.SpyInstance;
  const options: Options = {
    from: 'test@example.com',
    to: 'recipient@example.com',
    subject: 'Test quotation',
    html: '<p>Test</p>',
  };
  beforeEach(async (): Promise<void> => {
    mockSend.mockReset();
    logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation((): void => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation((): void => {});
    const module = await Test.createTestingModule({
      providers: [
        ResendProvider,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-api-key') },
        },
      ],
    }).compile();
    provider = module.get<ResendProvider>(ResendProvider);
  });
  afterEach((): void => {
    jest.restoreAllMocks();
  });
  it('throws when the API returns an error and never logs success', async (): Promise<void> => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'Mock rate limit' },
    });
    await expect(provider.send(options)).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(logSpy).not.toHaveBeenCalledWith('success');
  });
  it('propagates a network rejection', async (): Promise<void> => {
    mockSend.mockRejectedValue(new Error('Mock network error'));
    await expect(provider.send(options)).rejects.toThrow('Mock network error');
  });
  it('resolves when the API accepts the email', async (): Promise<void> => {
    mockSend.mockResolvedValue({ data: { id: 'test-email-id' }, error: null });
    await expect(provider.send(options)).resolves.toBeUndefined();
    expect(mockSend).toHaveBeenCalledWith(options);
  });
});
