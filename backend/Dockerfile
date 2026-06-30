# ── Stage 1: build TypeScript ─────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: production runtime ───────────────────────────────────────────────
# Keeps full node_modules (incl. ts-node/typeorm) and src/ so the container can
# run the same db:init / migration:run / seed npm scripts used in local dev —
# this lets docker-entrypoint.sh bootstrap the database on every start instead
# of requiring a manual step after `docker compose up`.
FROM node:22-alpine AS production
ENV NODE_ENV=production

RUN mkdir -p /app && chown node:node /app
WORKDIR /app

COPY --from=builder --chown=node:node /app/node_modules     ./node_modules
COPY --from=builder --chown=node:node /app/dist             ./dist
COPY --from=builder --chown=node:node /app/src              ./src
COPY --from=builder --chown=node:node /app/package*.json    ./
COPY --from=builder --chown=node:node /app/tsconfig*.json   ./
COPY --from=builder --chown=node:node /app/docker-entrypoint.sh ./

RUN chmod +x ./docker-entrypoint.sh

USER node
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]
