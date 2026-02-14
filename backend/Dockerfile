# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Copy prisma schema for postinstall script
COPY prisma ./prisma

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src ./src
COPY tsconfig.json ./
COPY tsconfig.json ./

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy built artifacts and necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Expose port (default for Express)
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
