# ============================================
# EchoNote – Backend Dockerfile
# Multi-stage build for smaller image
# ============================================

# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (cached layer)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY server/ ./server/
COPY client/ ./client/

# --- Production stage ---
FROM node:20-alpine AS production
WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S echonote -u 1001

# Copy from builder
COPY --from=builder --chown=echonote:nodejs /app ./

# Create uploads directory
RUN mkdir -p server/uploads logs && chown -R echonote:nodejs server/uploads logs

USER echonote

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server/index.js"]
