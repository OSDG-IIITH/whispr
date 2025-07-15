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

# Install all dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# ========================
# Build stage
# ========================
FROM base AS builder

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy application code
COPY . .

# Create .env.local file for production build
RUN echo "NEXT_PUBLIC_API_URL=/api" > .env.local

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

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create .env.local file for production
RUN echo "NEXT_PUBLIC_API_URL=/api" > .env.local

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NODE_ENV production

# Production command using the standalone server
CMD ["node", "server.js"]