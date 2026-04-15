# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:22-alpine AS deps

WORKDIR /app

# instalar pnpm
RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --no-frozen-lockfile

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments para Next.js (se embeben en el bundle)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_TIMEOUT=30000
ARG NEXT_PUBLIC_RETRY_ATTEMPTS=3
ARG NEXT_PUBLIC_RETRY_DELAY=1000

# Convertir ARG a ENV para que Next.js los vea durante build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_API_TIMEOUT=${NEXT_PUBLIC_API_TIMEOUT}
ENV NEXT_PUBLIC_RETRY_ATTEMPTS=${NEXT_PUBLIC_RETRY_ATTEMPTS}
ENV NEXT_PUBLIC_RETRY_DELAY=${NEXT_PUBLIC_RETRY_DELAY}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ============================================================================
# Stage 3: Runtime
# ============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache dumb-init

RUN addgroup -S nodejs -g 1001 \
 && adduser -S nextjs -u 1001

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "server.js"]