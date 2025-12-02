# Multi-stage build for Next.js
FROM node:20-alpine AS base

# Build argument to handle SSL certificate issues (e.g., Cloudflare WARP)
ARG APK_INSECURE=false

# Install dependencies only when needed
FROM base AS deps
# Handle SSL certificate issues with Cloudflare WARP or similar VPNs
# If APK_INSECURE is set to true, use HTTP mirror instead of HTTPS
RUN if [ "$APK_INSECURE" = "true" ]; then \
      echo "Using HTTP mirror for APK (bypassing SSL verification)..." && \
      sed -i 's|https://dl-cdn.alpinelinux.org|http://dl-cdn.alpinelinux.org|g' /etc/apk/repositories && \
      apk update; \
    fi && \
    apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create public directory if it doesn't exist (Next.js requires it)
RUN mkdir -p public

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
# Copy public directory (created in builder stage, may be empty)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js* ./next.config.js

USER nextjs

# Expose port (configurable via PORT env var)
EXPOSE 8079

ENV PORT=8079
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8079/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["npm", "start"]

