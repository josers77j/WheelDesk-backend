import { envValidationSchema } from './envs';
const minimumEnvironment: Record<string, string> = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  JWT_SECRET: 'test',
  REFRESH_TOKEN_PEPPER: 'test',
  DEFAULT_PASSWORD_HASH:
    '$2b$04$bMSptf5vOiUwNqHqhzXy2eJ0LWRaLlbW5iKGRqVbBc7lZPMaa6.G2',
  RESEND_API_KEY: 'test',
  MAIL_FROM: 'test@example.com',
  COOKIE_SECRET_KEY: 'test',
  FRONTEND_BASE_URL: 'http://localhost:4200',
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'test',
  AWS_SECRET_ACCESS_KEY: 'test',
  AWS_S3_BUCKET_IMAGES: 'test-images',
  AWS_S3_BUCKET_DOCS: 'test-docs',
};
describe('Internal sale environment', (): void => {
  it('starts without fiscal, signer or Redis configuration', (): void => {
    expect(
      envValidationSchema.validate(minimumEnvironment).error,
    ).toBeUndefined();
  });
  it.each([
    'DEFAULT_PASSWORD_HASH',
    'DATABASE_URL',
    'AWS_S3_BUCKET_IMAGES',
    'AWS_S3_BUCKET_DOCS',
    'RESEND_API_KEY',
  ])('rejects missing %s', (key: string): void => {
    const environment = { ...minimumEnvironment };
    delete environment[key];
    expect(
      envValidationSchema.validate(environment).error?.details[0].path,
    ).toEqual([key]);
  });
  it.each(['plaintext', '$2b$12$invalid'])(
    'rejects invalid default password hash %s',
    (hash: string): void => {
      expect(
        envValidationSchema.validate({
          ...minimumEnvironment,
          DEFAULT_PASSWORD_HASH: hash,
        }).error?.details[0].path,
      ).toEqual(['DEFAULT_PASSWORD_HASH']);
    },
  );

  it('accepts credentials and region provided by the AWS SDK environment', (): void => {
    const environment = { ...minimumEnvironment };
    delete environment.AWS_REGION;
    delete environment.AWS_ACCESS_KEY_ID;
    delete environment.AWS_SECRET_ACCESS_KEY;
    expect(envValidationSchema.validate(environment).error).toBeUndefined();
  });

  it('accepts an omitted or empty S3 endpoint for AWS', (): void => {
    expect(
      envValidationSchema.validate({
        ...minimumEnvironment,
        AWS_ENDPOINT_URL: '',
      }).error,
    ).toBeUndefined();
  });
  it('accepts the blank optional migration hash from the example env', (): void => {
    expect(
      envValidationSchema.validate({
        ...minimumEnvironment,
        MIGRATION_UNLOCK_PASSWORD_HASH: '',
      }).error,
    ).toBeUndefined();
  });
});
