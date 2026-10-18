import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  Attachment,
  MailProvider,
  Options,
} from './interface/mail-provider.interface';

export interface InvoiceEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}

@Injectable()
export class MailService {
  constructor(
    @Inject('MAIL_PROVIDER') private readonly provider: MailProvider,
    private readonly configService: ConfigService,
  ) {}

  async send(options: Options) {
    return this.provider.send(options);
  }

  async sendInvoiceEmail(options: InvoiceEmailOptions) {
    const from = this.configService.get<string>('MAIL_FROM');
    if (!from) {
      throw new Error('Falta la variable de entorno requerida: MAIL_FROM');
    }

    return this.provider.send({
      from,
      ...options,
    });
  }
}
