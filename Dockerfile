# ──────────────────────────────────────────
# Stage 1: Build the React frontend
# ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL deps (including devDeps for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ──────────────────────────────────────────
# Stage 2: Production image
# ──────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install ONLY production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the built frontend from Stage 1
COPY --from=builder /app/dist ./dist

# Copy the server source
COPY server.js ./
COPY server/ ./server/

# Cloud Run provides PORT env var (default 8080)
ENV PORT=8080
EXPOSE 8080

# Use non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["node", "server.js"]
