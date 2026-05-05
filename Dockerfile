# Multi-stage build for Next.js production
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Build stage
FROM base AS builder
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# Build the Next.js application
RUN npm run build

# Production runtime stage
FROM base AS runner
RUN apk add --no-cache libc6-compat dumb-init
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Start application
CMD ["node", "server.js"]
