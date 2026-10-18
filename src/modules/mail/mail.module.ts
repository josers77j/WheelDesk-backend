import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ResendProvider } from './providers/resend.provider';

@Module({
  providers: [
    {
      provide: 'MAIL_PROVIDER',
      useClass: ResendProvider,
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
