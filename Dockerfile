# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

# Install system dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# --- Stage 2: Production ---
FROM node:20-alpine

# Install runtime dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

# Expose the application port
EXPOSE 8000

# Start the application in production mode
CMD ["npm", "start"]
