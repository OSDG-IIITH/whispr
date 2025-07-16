# Cache dependencies
FROM node:20-slim AS node_cache
WORKDIR /cache/
COPY package*.json ./
RUN npm ci

# Build and start
FROM node:20-slim AS build
WORKDIR /app
COPY --from=node_cache /cache/ .
COPY . .

# Create .env.local file for production build
RUN echo "NEXT_PUBLIC_API_URL=/whispr/api" > .env.local

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Start the application
ENTRYPOINT [ "node", ".next/standalone/server.js" ]