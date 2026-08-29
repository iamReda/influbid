# Multi-stage Dockerfile for saas / marketing Next.js apps (pnpm monorepo)
# Usage: docker build -f deploy/Dockerfile --build-arg APP_NAME=saas .

ARG APP_NAME=saas

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/saas/package.json apps/saas/
COPY apps/marketing/package.json apps/marketing/
COPY packages/ai/package.json packages/ai/
COPY packages/api/package.json packages/api/
COPY packages/auth/package.json packages/auth/
COPY packages/database/package.json packages/database/
COPY packages/i18n/package.json packages/i18n/
COPY packages/logs/package.json packages/logs/
COPY packages/mail/package.json packages/mail/
COPY packages/notifications/package.json packages/notifications/
COPY packages/payments/package.json packages/payments/
COPY packages/permissions/package.json packages/permissions/
COPY packages/storage/package.json packages/storage/
COPY packages/ui/package.json packages/ui/
COPY packages/utils/package.json packages/utils/
COPY tooling/scripts/package.json tooling/scripts/
COPY tooling/tailwind/package.json tooling/tailwind/
COPY tooling/typescript/package.json tooling/typescript/
RUN pnpm install --frozen-lockfile

FROM base AS builder
ARG APP_NAME
ARG NEXT_PUBLIC_SAAS_URL
ARG NEXT_PUBLIC_MARKETING_URL
ENV NEXT_PUBLIC_SAAS_URL=$NEXT_PUBLIC_SAAS_URL
ENV NEXT_PUBLIC_MARKETING_URL=$NEXT_PUBLIC_MARKETING_URL
ENV NODE_ENV=production
COPY --from=deps /app ./
COPY . .
RUN pnpm --filter @repo/database generate
RUN if [ "$APP_NAME" = "marketing" ]; then pnpm --filter marketing generate; fi
RUN pnpm --filter "${APP_NAME}" build

FROM node:22-alpine AS runner
ARG APP_NAME
ENV APP_NAME=$APP_NAME
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public
USER nextjs
EXPOSE 3000
ENV HOSTNAME=0.0.0.0
CMD ["sh", "-c", "node apps/$APP_NAME/server.js"]

FROM base AS migrator
ENV NODE_ENV=production
COPY --from=deps /app ./
COPY packages/database ./packages/database
COPY tooling/typescript ./tooling/typescript
COPY packages/utils ./packages/utils
WORKDIR /app/packages/database
CMD ["pnpm", "exec", "prisma", "db", "push", "--skip-generate"]
