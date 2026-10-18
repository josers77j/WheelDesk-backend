# syntax=docker/dockerfile:1.7
FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
WORKDIR /app
FROM base AS builder
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig*.json nest-cli.json prisma.config.ts lambda.ts ./
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY src ./src
COPY fonts ./fonts
COPY LICENSE ./LICENSE
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm exec prisma generate
RUN pnpm run build
RUN pnpm prune --prod
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/fonts ./fonts
COPY --from=builder --chown=node:node /app/LICENSE ./LICENSE
USER node
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
