# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package.json backend/package-lock.json ./

# Copy prisma schema for postinstall script
COPY backend/prisma ./prisma

# Install dependencies (including dev dependencies for build)
RUN npm ci --ignore-scripts

# Copy source code
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Copy prisma config
COPY backend/prisma.config.ts ./

# Generate Prisma Client
# Set a dummy DATABASE_URL to satisfy validation during build
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
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
