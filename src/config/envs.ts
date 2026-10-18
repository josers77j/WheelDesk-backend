import * as joi from 'joi';
import { BCRYPT_PASSWORD_HASH_PATTERN } from '../common/utils/password-hash.util';

export const envValidationSchema = joi
  .object({
    PORT: joi.number().default(3000),
    JWT_SECRET: joi.string().required(),
    MIGRATION_UNLOCK_PASSWORD_HASH: joi.string().allow('').optional(),
    REFRESH_TOKEN_PEPPER: joi.string().required(),
    DEFAULT_PASSWORD_HASH: joi
      .string()
      .pattern(BCRYPT_PASSWORD_HASH_PATTERN)
      .messages({
        'string.pattern.base':
          'DEFAULT_PASSWORD_HASH debe contener un hash bcrypt válido.',
      })
      .required(),
    DATABASE_URL: joi
      .string()
      .uri({ scheme: ['postgresql', 'postgres'] })
      .required(),
    AWS_REGION: joi.string().optional(),
    AWS_ACCESS_KEY_ID: joi.string().optional(),
    AWS_SECRET_ACCESS_KEY: joi.string().optional(),
    AWS_S3_BUCKET_IMAGES: joi.string().required(),
    AWS_S3_BUCKET_DOCS: joi.string().required(),
    AWS_S3_BUCKET_PURCHASES: joi.string().optional(),
    AWS_ENDPOINT_URL: joi
      .string()
      .uri({ scheme: ['http', 'https'] })
      .allow('')
      .optional(),
    RESEND_API_KEY: joi.string().required(),
    MAIL_FROM: joi.string().required(),
    COOKIE_SECRET_KEY: joi.string().required(),
    FRONTEND_BASE_URL: joi.string().required(),
    TRUST_CLOUDFLARE_IP: joi.boolean().default(false),
  })
  .unknown(true);
