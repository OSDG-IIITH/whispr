FROM node:18-alpine

WORKDIR /app

# Install dependencies needed for node-gyp
RUN apk add --no-cache python3 make g++

# Copy package files first for better caching  
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create .env.local file for Docker
RUN echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Production command
CMD ["npm", "run", "start"]