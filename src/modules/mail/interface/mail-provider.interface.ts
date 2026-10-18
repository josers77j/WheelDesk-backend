export interface MailProvider {
  send(options: Options): Promise<void>;
}

export interface Options {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}

export interface Attachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
}
