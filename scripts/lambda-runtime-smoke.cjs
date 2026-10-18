const assert = require('node:assert/strict');

assert.equal(process.platform, 'linux');
assert.equal(process.arch, 'x64');
assert.equal(process.features.require_module, false);
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('offline-runtime-fixture', 4);
assert.ok(bcrypt.compareSync('offline-runtime-fixture', hash));
Object.assign(process.env, {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://qa:qa@localhost:5432/qa',
  JWT_SECRET: 'offline-runtime-fixture',
  REFRESH_TOKEN_PEPPER: 'offline-runtime-fixture',
  DEFAULT_PASSWORD_HASH: hash,
  COOKIE_SECRET_KEY: 'offline-runtime-fixture',
  RESEND_API_KEY: 're_offline_runtime_fixture',
  MAIL_FROM: 'qa@example.com',
  FRONTEND_BASE_URL: 'https://example.com',
  AWS_S3_BUCKET_IMAGES: 'qa-images',
  AWS_S3_BUCKET_DOCS: 'qa-docs',
  AWS_REGION: 'us-east-1',
});
assert.equal(typeof require('./dist/lambda.js').handler, 'function');
assert.throws(() => require.resolve('@nestjs/event-emitter'), {
  code: 'MODULE_NOT_FOUND',
});
assert.throws(() => require.resolve('geoip-lite'), {
  code: 'MODULE_NOT_FOUND',
});
const { PrismaClient } = require('./dist/prisma/generated/prisma/client.js');
const { PrismaPg } = require('@prisma/adapter-pg');
const client = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
assert.equal(typeof client.$connect, 'function');
require('exceljs');
require('pdfmake');
Promise.all([
  import('@prisma/client/runtime/query_compiler_fast_bg.postgresql.js'),
  import(
    '@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.js'
  ),
  require('sharp')({
    create: { width: 1, height: 1, channels: 3, background: 'white' },
  })
    .png()
    .toBuffer(),
])
  .then(() => {
    console.log(
      'PASS: Lambda handler with require(ESM) disabled; runtime dependencies work without EventEmitter/GeoIP.',
    );
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
