# Multi-stage build for Admin Next.js App
FROM node:18-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@8

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/
COPY apps/*/package.json ./apps/*/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# ================================
# Build stage
# ================================
FROM base AS builder

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm run db:generate

# Build admin application
RUN pnpm run build --filter=admin

# Prune dev dependencies
RUN pnpm install --frozen-lockfile --prod

# ================================
# Production stage  
# ================================
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy built admin application
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/public ./apps/admin/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/package.json ./apps/admin/package.json

# Copy shared packages
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages

# Copy node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy package files
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-lock.yaml ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the admin application
CMD ["node_modules/.bin/next", "start", "apps/admin"]