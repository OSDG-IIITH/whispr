# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies needed for node-gyp
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# Copy package files first for better caching  
COPY package*.json ./

# ========================
# Dependencies stage
# ========================
FROM base AS deps

# Install dependencies (production only)
RUN npm ci --only=production && npm cache clean --force

# ========================
# Build stage
# ========================
FROM base AS builder

# Install all dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Copy application code
COPY . .

# Create .env.local file for production build
RUN echo "NEXT_PUBLIC_API_URL=/api/v1" > .env.local

# Build the application
RUN npm run build

# ========================
# Production stage
# ========================
FROM node:18-alpine AS runner

WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Production command
CMD ["node", "server.js"]