import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailProvider } from './interface/mail-provider.interface';

describe('MailService', () => {
  let service: MailService;

  const mockProvider: MailProvider = {
    send: jest.fn(() => Promise.resolve(undefined)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: 'MAIL_PROVIDER',
          useValue: mockProvider,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('onboarding@resend.dev'),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send invoice email using MAIL_FROM from config', async () => {
    await service.sendInvoiceEmail({
      to: 'customer@example.com',
      subject: 'Factura electrónica',
      html: '<p>Factura</p>',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockProvider.send).toHaveBeenCalledWith({
      from: 'onboarding@resend.dev',
      to: 'customer@example.com',
      subject: 'Factura electrónica',
      html: '<p>Factura</p>',
    });
  });
});
