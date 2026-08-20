# syntax=docker/dockerfile:1

# ---- deps: install dependencies only (cached separately from source changes) ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- builder: compile the Next.js app ----
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so
# real values must be supplied as build args (see docker-compose.prod.yml).
ARG NEXT_PUBLIC_SERVER_IP
ARG NEXT_PUBLIC_STORE_URL
ARG NEXT_PUBLIC_DISCORD_INVITE
ARG NEXT_PUBLIC_DISCORD_SERVER_ID
ENV NEXT_PUBLIC_SERVER_IP=$NEXT_PUBLIC_SERVER_IP \
    NEXT_PUBLIC_STORE_URL=$NEXT_PUBLIC_STORE_URL \
    NEXT_PUBLIC_DISCORD_INVITE=$NEXT_PUBLIC_DISCORD_INVITE \
    NEXT_PUBLIC_DISCORD_SERVER_ID=$NEXT_PUBLIC_DISCORD_SERVER_ID

# Server-only env vars are read at request time, not baked into the build —
# these placeholders just let `next build` prerender static routes without
# needing a live DB/Redis reachable from inside the build container. The
# real values come from .env on the host at container runtime.
ENV NODE_ENV=production \
    REDIS_MOCK=true \
    DATABASE_URL="mysql://build:build@localhost:3306/build" \
    SESSION_SECRET="build-time-placeholder-0000000000000000000000000000"

RUN npm run build

# ---- runner: minimal production image ----
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
