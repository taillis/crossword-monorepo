# Stage 1: Build packages and applications
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy workspace package manifests
COPY package.json package-lock.json turbo.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared-types ./packages/shared-types
COPY apps/api ./apps/api
COPY apps/web ./apps/web

# Build shared types, frontend PWA and backend API
RUN npm run build

# Prune development dependencies
RUN npm prune --omit=dev

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    STATIC_ROOT=/app/apps/web/dist

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 crossword

# Copy production runtime files from builder
COPY --from=builder --chown=crossword:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=crossword:nodejs /app/package.json ./package.json
COPY --from=builder --chown=crossword:nodejs /app/packages/shared-types ./packages/shared-types
COPY --from=builder --chown=crossword:nodejs /app/apps/api ./apps/api
COPY --from=builder --chown=crossword:nodejs /app/apps/web/dist ./apps/web/dist

USER crossword

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
