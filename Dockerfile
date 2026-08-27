# APEPLOYEE — single-origin production image.
# One Node service serves the API, the built site, and the NFT images/metadata,
# so apeployee.fun is fully same-origin (no CORS, session cookie just works).

# ---- build stage ----
FROM node:20-slim AS build
WORKDIR /app

# frontend build
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci
COPY frontend ./frontend
RUN cd frontend && npm run build

# backend deps + prisma client
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci
COPY backend ./backend
COPY nft ./nft
RUN cd backend && npx prisma generate

# ---- runtime stage ----
FROM node:20-slim
WORKDIR /app/backend
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app /app

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Create/update the SQLite schema, seed jobs + the 1000-pass registry, then serve.
# (Point DATABASE_URL at a mounted volume, e.g. file:/data/prod.db, to persist.)
CMD ["sh", "-c", "npx prisma db push --skip-generate && node seed.js && node server.js"]
