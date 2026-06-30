# ── Stage 1: production dependencies only ────────────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: build TypeScript ─────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 3: production runtime ───────────────────────────────────────────────
FROM node:18-alpine AS production
ENV NODE_ENV=production

RUN mkdir -p /app && chown node:node /app
WORKDIR /app

COPY --from=deps    --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist         ./dist

USER node
EXPOSE 3000

CMD ["node", "dist/main"]
