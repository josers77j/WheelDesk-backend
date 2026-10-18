import { ConfigService } from '@nestjs/config';
import { MailProvider, Options } from './../interface/mail-provider.interface';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendProvider implements MailProvider {
  private readonly logger = new Logger('Mail');
  private readonly resend: Resend;

  constructor(private readonly config: ConfigService) {
    const resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.resend = resend;
  }

  async send(options: Options): Promise<void> {
    const { data, error } = await this.resend.emails.send(options);

    if (error) {
      this.logger.error(error);
      throw new ServiceUnavailableException('No se pudo enviar el correo');
    }

    this.logger.log({ data });
    this.logger.log('success');
  }
}
