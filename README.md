# Tire Shop System — Backend

A NestJS API for tire workshop inventory, purchases, sales, quotations, invoice documents, accounting exports and user administration. It uses PostgreSQL/Prisma, S3-compatible storage and Resend. The application interface and validation messages remain in Spanish. Tax catalogs, document interpretation and date handling currently target El Salvador; this is not a country-independent fiscal engine.

Use this API with the [WheelDesk frontend](https://github.com/josers77j/WheelDesk-frontend).

Run all commands in this README from the backend repository root unless stated otherwise.

This project is licensed under [AGPL-3.0-only](LICENSE). The bundled Roboto fonts retain their own [SIL Open Font License](fonts/OFL.txt).

## Requirements before installation

- Node.js **22.12 or newer in the Node 22 line**, and pnpm **10.13.1**. Node 22 is also the configured Lambda runtime.
- Docker with Docker Compose v2, running locally. Compose provides PostgreSQL 16 and Floci for S3 emulation; Nest and Angular run on your host machine.
- Available local ports: PostgreSQL `5432`, Floci `4566`, Nest `3000`, Angular `4200`.
- AWS CLI v2 for the local bucket commands and, optionally, later deployment. Local bucket commands explicitly target Floci and use dummy credentials.
- A Resend API key and an allowed sender when testing email. Replace `RESEND_API_KEY` and `MAIL_FROM`; the example values do not deliver email. No Redis/BullMQ service is required.

Use pnpm consistently; do not regenerate dependency locks with a different package manager as part of setup.

## Development setup

### 1. Install dependencies and configure the environment

```sh
corepack enable
corepack prepare pnpm@10.13.1 --activate
pnpm install --frozen-lockfile
cp .env.example .env
```

The example targets local Docker services. Its PostgreSQL password and Floci credentials are development fixtures, not production credentials. If you change `POSTGRES_PASSWORD`, change the password in `DATABASE_URL` too; URL-encode special characters in connection URLs.

Generate a separate random value for each of `JWT_SECRET`, `REFRESH_TOKEN_PEPPER` and `COOKIE_SECRET_KEY`, and paste each result into `.env`:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Generate the bcrypt hash used for the initial administrator and default passwords of subsequently created users:

```sh
pnpm migration:hash --target default-password
```

The command prompts for a password and writes `DEFAULT_PASSWORD_HASH` to `.env`. Remember the password you enter: you will use it to sign in; the hash itself is not a login password. Set `SEED_ADMIN_NAME` and `SEED_ADMIN_EMAIL` before running the user seed. There is no built-in administrator password.

For the optional invoice-import unlock password, run:

```sh
pnpm migration:hash --target migration
```

Keep `.env` local. Never commit API keys, production URLs containing credentials, or generated password hashes.

### 2. Start the local infrastructure

```sh
docker compose up -d --wait
docker compose ps
```

Compose starts **only PostgreSQL and Floci**, not the API. Both services bind to loopback and persist their data in named volumes. The database health check waits for PostgreSQL readiness; Floci may need a moment before accepting its first request.

If a port is occupied, change `POSTGRES_PORT` or `AWS_LOCAL_PORT` in `.env` and update `DATABASE_URL` or `AWS_ENDPOINT_URL` to match. Use `docker compose logs db s3` to diagnose startup failures. Changing a database password in `.env` does not change credentials inside an already initialized PostgreSQL volume.

### 3. Create the three local buckets

The backend does not create buckets. Run the following once, after Floci is ready:

```sh
for bucket in workshop-product-images workshop-sale-documents workshop-purchase-documents; do
  AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_EC2_METADATA_DISABLED=true \
    aws --endpoint-url http://localhost:4566 --region us-east-1 \
    s3api create-bucket --bucket "$bucket"
done
```

Use the names from your `.env` if you changed them. Update the endpoint in this command if you changed `AWS_LOCAL_PORT`. An existing-bucket response is expected if you repeat setup. These commands do not target your real AWS account.

The three variables are `AWS_S3_BUCKET_IMAGES`, `AWS_S3_BUCKET_DOCS` and `AWS_S3_BUCKET_PURCHASES`. While using the local endpoint, the application configures read CORS for the image and sales-document buckets using `FRONTEND_BASE_URL`. Create the buckets before starting Nest. Purchase-document viewing uses authenticated backend endpoints.

### 4. Generate the client, apply the schema and initialize data

```sh
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm seed -- --target all --confirm-reset
```

`generate` creates the local Prisma client; it does not apply schema changes. `migrate deploy` applies checked-in migrations. This independent project has one initial migration intended for a **new, empty database**; it is not an upgrade path for the source project's database.

The `all` seed installs catalogs, vehicle types, an administrator and **fictional example company settings**. Replace company details in the application before using real documents. Seed targets `all`, `catalogs`, `users` and `company-settings` replace their respective data; `--confirm-reset` is deliberate consent for that seed operation. Do not rerun them against a populated database without reviewing their implementation and dependencies. The `vehicle-types` target only adds missing types, although the CLI still requires the confirmation flag.

To inspect available targets without changing anything:

```sh
pnpm exec prisma db seed -- --help
```

### 5. Start Nest and the frontend

```sh
pnpm start:dev
```

API base URL: `http://localhost:3000/api`. Development Swagger UI: `http://localhost:3000/api`. Start the frontend in a second terminal using its [README](https://github.com/josers77j/WheelDesk-frontend#readme), then sign in with `SEED_ADMIN_EMAIL` and the password used when generating the default hash.

`FRONTEND_BASE_URL=http://localhost:4200` must match the browser's origin exactly. Use `localhost` consistently; do not switch one application to `127.0.0.1` while leaving CORS configured for `localhost`.

## Essential commands

```sh
pnpm start:dev                         # Watch and restart the local API
pnpm exec prisma generate             # Regenerate Prisma Client after schema changes
pnpm exec prisma migrate dev --name describe_change  # Author a migration in a development DB
pnpm exec prisma migrate deploy       # Apply committed migrations without authoring new ones
pnpm exec prisma studio               # Inspect data in the configured development database
pnpm exec tsc --noEmit --incremental false
pnpm lint --no-fix                     # Check only; plain pnpm lint may rewrite files
pnpm test --runInBand
pnpm test:seed --runInBand
node --test scripts/*.test.mjs scripts/*.test.cjs
pnpm run build
pnpm start:prod                        # Run compiled HTTP server from dist/src/main.js
```

Run `migrate dev` only against a development database. Review generated SQL and commit it under `prisma/migrations/`; never edit a migration already applied to a shared database. Prisma Client output, `.env`, `node_modules`, build directories and ZIPs stay out of Git.

For optional local tracing, `pnpm trace:up` starts Jaeger and `pnpm start:dev:trace` starts Nest with development tracing. Jaeger is available at `http://localhost:16686`; `pnpm trace:down` stops that separate tracing stack.

To stop the regular local services without removing their volumes:

```sh
docker compose down
```

`docker compose down -v` also deletes the development PostgreSQL and Floci volumes. Use it only when you intentionally want to discard **all local data and uploaded files** for this Compose project, then repeat bucket, migration and seed setup.

## Recommended production deployment: AWS Lambda + HTTP API

The repository includes the packaging code, not a preconfigured AWS account. Create and configure your own AWS resources before sending traffic. Use an IAM/Identity Center operator identity rather than the AWS root account, and verify the intended account and region. You may also deploy the ordinary HTTP server with the production `Dockerfile`; Lambda is the option described below because it matches the existing handler and packaging flow.

### What the included files do

- `src/main.ts` starts a normal HTTP listener. It remains the entry point for `pnpm start:dev` and `pnpm start:prod`.
- `lambda.ts` initializes Nest once per execution environment and adapts API Gateway **HTTP API payload v2** events. It does not call `listen()` and does not provision cloud resources.
- `Dockerfile.lambda` generates Prisma Client, builds the API on Linux x86_64, checks runtime imports/native libraries, and exports `.lambda-package/tire-workshop-backend.zip`.
- `.github/workflows/ci.yml` runs quality checks on pushes and pull requests.
- `.github/workflows/lambda-package.yml` is a manual **Package Lambda ZIP** workflow. It builds and uploads the ZIP as a GitHub artifact. It does **not deploy**, modify Lambda environment variables or need AWS secrets.
- `serverless.yml` is an optional infrastructure/deployment definition. It expects your execution-role ARN and environment variables; it is a separate route from manually managing the function in the AWS console.

The workflow files assume the backend contents are at the root of their own GitHub repository. If you publish `front` and `back` inside one repository instead, relocate workflows to the repository's root `.github/workflows` and adjust working directories, paths and build contexts first. A workflow nested under `back/.github` will not run in a parent repository.

### 1. Prepare PostgreSQL and email

Create a production PostgreSQL database, such as Neon, near the AWS region used by Lambda. Use the provider's pooled application connection where appropriate; run migrations with a suitable direct/admin connection from a trusted machine or controlled job. Apply migrations once before releasing code that needs them; never run migrations or seeds inside the Lambda request handler. Initialize catalogs and the administrator only for the new installation.

Configure a verified Resend sender/domain, set `RESEND_API_KEY` and `MAIL_FROM`, and verify its SPF/DKIM/DMARC setup using the provider's instructions. An HTML template alone does not guarantee inbox delivery.

### 2. Create the S3 buckets and the runtime IAM role

Create separate buckets for product images, sales originals and purchase originals. Choose your own globally unique bucket names, preferably in the function's region. Set the corresponding three environment variables. Keep sales and purchase document buckets private and keep their public-access blocks enabled.

Create a **Lambda execution role** trusted by `lambda.amazonaws.com`. Give it CloudWatch logging permissions (for example, `AWSLambdaBasicExecutionRole`) and object access only to your buckets. A minimal object-permissions statement looks like this; replace every bucket placeholder before attaching it:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
    "Resource": [
      "arn:aws:s3:::YOUR_IMAGES_BUCKET/*",
      "arn:aws:s3:::YOUR_SALES_BUCKET/*",
      "arn:aws:s3:::YOUR_PURCHASES_BUCKET/*"
    ]
  }]
}
```

This runtime role does not need permission to create buckets, change IAM policies or deploy functions. Your human/provisioning identity needs separate permissions to create the infrastructure and pass the execution role to Lambda.

**Image visibility:** the current image implementation returns ordinary S3 object URLs, not signed image URLs. For public product photos, configure public **read-only** access on the images bucket only, following the S3 public-access documentation. Anonymous users should never receive upload/delete permissions. If you need private images, implement signed image delivery or a protected proxy before using that mode; granting `GetObject` to Lambda alone does not grant access to the browser.

Sales-document previews fetch signed S3 URLs directly from the browser. Configure read CORS on the sales-document bucket for the exact frontend origin, with `GET`/`HEAD` and exposed `Content-Disposition`. Configure equivalent read CORS on the images bucket for browser features that fetch image bytes. The backend configures CORS automatically only for supported local emulator endpoints, not production S3. CORS does not make a private bucket public.

### 3. Build or download the Lambda ZIP

Publish this backend as a repository, commit the workflow to its default branch, then open **Actions → Package Lambda ZIP → Run workflow**. After it succeeds, download its artifact and extract the outer GitHub download archive. Deploy the inner `tire-workshop-backend.zip`; do not upload the outer artifact archive as your function code.

To produce the same package locally with Docker Buildx:

```sh
docker buildx build --platform linux/amd64 -f Dockerfile.lambda \
  --target artifact --output type=local,dest=.lambda-package .
```

Building a regular `dist` directory on macOS or Windows does not make native dependencies Linux-compatible. `pnpm package:lambda --inspect` only creates an inspection ZIP on an incompatible host; it is not a production deployment artifact.

### 4. Create the function and set production configuration

In AWS Lambda create a function using **Node.js 22**, **x86_64**, your execution role, an initial memory setting of **1024 MB**, and a **30-second** timeout. These settings match `serverless.yml`; measure real workloads before changing them. Set the handler to **`dist/lambda.handler`** and upload the package. Direct ZIP uploads are limited to 50 MB; use the S3 upload path for larger packages. The uncompressed package, including layers, must remain within Lambda's 250 MB limit. The current packager checks its own runtime files against that uncompressed limit.

Configure production environment variables in the Lambda service or through your own controlled configuration process:

- `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_PEPPER`, `DEFAULT_PASSWORD_HASH`, `COOKIE_SECRET_KEY`.
- `FRONTEND_BASE_URL` as the exact HTTPS frontend origin, without a path; `RESEND_API_KEY` and `MAIL_FROM`.
- `AWS_S3_BUCKET_IMAGES`, `AWS_S3_BUCKET_DOCS`, `AWS_S3_BUCKET_PURCHASES`.
- Optional `MIGRATION_UNLOCK_PASSWORD_HASH` if invoice imports should be unlocked.

Do not copy the local `AWS_ENDPOINT_URL`, dummy `AWS_ACCESS_KEY_ID` or dummy `AWS_SECRET_ACCESS_KEY` into Lambda. Leave the endpoint unset; the AWS SDK obtains credentials from the function's execution role, and Lambda supplies its region. `POSTGRES_*`, `AWS_LOCAL_PORT` and `SEED_ADMIN_*` are setup/local variables, not Lambda runtime requirements. No `.env` file is included in the ZIP. Store actual secrets in your account, not in the repository or frontend. The current application reads `process.env`; adopting Secrets Manager retrieval requires an explicit integration rather than just creating a secret.

If you choose `serverless.yml` to provision instead, set `LAMBDA_EXECUTION_ROLE_ARN` to your own role and supply every `${env:...}` value to Serverless through a safe local/CI configuration. A full Serverless deployment manages the environment declared in that file; it is not the same as updating code only. Do not mix both configuration ownership models without deciding which one controls the function's environment.

### 5. Connect API Gateway and your domains

Create an **API Gateway HTTP API** integrated with the function, using payload format **2.0**. Add `ANY /` and `ANY /{proxy+}` routes and a stage (a default stage is simplest). Ensure API Gateway has permission to invoke the function. Nest already owns the `/api` prefix, so an ordinary endpoint is `/api/auth/login`.

The Nest handler sends credentialed CORS headers. Keep one consistent CORS configuration if you also configure API Gateway; the exact frontend origin and credentials must survive the gateway. Do not use `*` for credentialed browser requests.

For production cookie sessions, prefer related HTTPS custom domains such as `app.example.com` and `api.example.com`. Configure an ACM certificate in the API Gateway region, complete its DNS validation, create the API Gateway custom domain and an empty-path API mapping, then point DNS at the gateway's regional domain. Keep ACM's validation CNAME for renewal. When using Cloudflare DNS, the ACM validation record must be DNS-only; start the API CNAME as DNS-only as well. Set the frontend API URL to `https://api.example.com/api`. Cross-site defaults such as a `pages.dev` frontend and an `execute-api` backend may trigger browser cookie blocking; CORS alone does not override those privacy restrictions.

HTTP API integrations have a 30-second limit. A Lambda timeout increase alone does not extend it. Large imports must remain split into bounded requests; this application is not an asynchronous background-job service. Observe Lambda's synchronous payload limits as well, especially with base64-encoded ZIP/PDF responses.

### 6. Update code and inspect logs

With your AWS CLI already authenticated to the correct account, a code-only update through your own deployment bucket is:

```sh
aws sts get-caller-identity
aws s3 cp .lambda-package/tire-workshop-backend.zip \
  s3://YOUR_DEPLOY_BUCKET/releases/tire-workshop-backend.zip --region us-east-1
aws lambda update-function-code --function-name YOUR_FUNCTION \
  --s3-bucket YOUR_DEPLOY_BUCKET --s3-key releases/tire-workshop-backend.zip --region us-east-1
aws lambda wait function-updated-v2 --function-name YOUR_FUNCTION --region us-east-1
aws logs tail /aws/lambda/YOUR_FUNCTION --follow --region us-east-1
```

Replace placeholders and region. The deployment bucket is separate from business-document buckets. This updates an existing function; it does not create another one or change its environment variables. For automated deployment later, use a separate GitHub OIDC deployment role restricted to your repository and release branch/environment, not permanent AWS access keys or the Lambda runtime role. The supplied packaging workflow intentionally has no such deployment permissions.

## Troubleshooting

- **Environment validation fails:** check `.env`, generate `DEFAULT_PASSWORD_HASH`, and replace required placeholders. Never troubleshoot by committing the environment file.
- **Database authentication fails:** check URL/password/port consistency and whether the existing named volume was initialized with older credentials.
- **Prisma import/type errors:** run `pnpm exec prisma generate` after installing dependencies or changing the schema.
- **Missing buckets or AccessDenied:** local buckets must be created first. In AWS, check the execution role, actual bucket names, object permissions, and image visibility policy separately.
- **Upload succeeds but image does not display:** an ordinary image URL needs browser-readable access; Lambda's private permissions alone are insufficient.
- **PDF/JSON preview fails but downloading works:** check the sales bucket's browser CORS configuration and rebuild/restart the frontend after PDF.js asset changes.
- **Login succeeds then immediately returns to login:** inspect cookies, exact frontend origin, HTTPS, credentials and same-site domains; do not assume every 401 is a CORS failure.
- **Lambda returns 500 before Nest starts:** inspect CloudWatch logs, handler path, runtime/architecture, required variables and whether the ZIP was built using `Dockerfile.lambda`.
- **Gateway timeout:** inspect the slow request, database region and batch size; a gateway timeout does not guarantee an already running Lambda stopped processing.

## License

Copyright (c) 2026 josers77j.

The original code in this project is licensed under the **GNU Affero General Public License, version 3 only** (`AGPL-3.0-only`). You may use, modify and redistribute it, including commercially, under that license. See the complete [LICENSE](LICENSE) text for the terms and the absence of warranty.

When distributing covered versions, comply with the applicable corresponding-source and license-notice requirements. If you deploy a modified version that users interact with over a network, offer those users access to the corresponding source for the deployed version as required by section 13. A link to an unrelated or outdated source snapshot does not describe the version they are using. Source availability does not mean publishing application secrets or customer data.

Third-party dependencies and bundled assets retain their own licenses and notices; this project license does not replace them.

The bundled Roboto font license is preserved in [fonts/OFL.txt](fonts/OFL.txt).

## Official references

- [Floci configuration and persistence](https://github.com/floci-io/floci)
- [Prisma Migrate deployment](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production)
- [Lambda execution roles](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
- [ACM DNS validation](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html)
- [HTTP API custom domains](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-custom-domain-names.html)
- [Lambda environment variables](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html)
- [Lambda quotas](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)
- [HTTP API quotas](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-quotas.html)
- [S3 read CORS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ManageCorsUsing.html)
- [S3 public read access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteAccessPermissionsReqd.html)
- [IAM OIDC trust configuration](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html)
