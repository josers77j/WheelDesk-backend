const testEnvironment: Record<string, string> = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'test',
  AWS_SECRET_ACCESS_KEY: 'test',
  AWS_S3_BUCKET_IMAGES: 'test-images',
  AWS_S3_BUCKET_DOCS: 'test-docs',
  JWT_SECRET: 'test-jwt-secret',
  REFRESH_TOKEN_PEPPER: 'test-refresh-token-pepper',
  DEFAULT_PASSWORD_HASH:
    '$2b$04$bMSptf5vOiUwNqHqhzXy2eJ0LWRaLlbW5iKGRqVbBc7lZPMaa6.G2',
  RESEND_API_KEY: 'test-resend-api-key',
  MAIL_FROM: 'test@example.com',
  COOKIE_SECRET_KEY: 'test-cookie-secret',
  FRONTEND_BASE_URL: 'http://localhost:4200',
};

for (const [key, value] of Object.entries(testEnvironment)) {
  process.env[key] ??= value;
}
