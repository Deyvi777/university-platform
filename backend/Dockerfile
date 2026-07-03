# Backend (NestJS 11 + Prisma 7). Contexto de build = raíz del monorepo:
#   docker build -f backend/Dockerfile .
FROM node:22-bookworm-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

# Manifests primero para cachear la instalación de dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
RUN pnpm install --frozen-lockfile --filter backend

COPY backend backend

# prisma generate no se conecta a la DB, pero prisma.config.ts exige que
# DATABASE_URL exista; se pasa un valor de relleno solo para este paso.
RUN cd backend \
  && DATABASE_URL="postgresql://build:build@localhost:5432/build" pnpm exec prisma generate \
  && pnpm build

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

WORKDIR /app/backend
# `db push` en vez de `migrate deploy`: el historial de migraciones está
# driftado respecto al esquema real (ver CLAUDE.md → Prisma 7). En una DB
# nueva crea el esquema completo; en despliegues siguientes aplica los
# cambios incrementales, igual que el flujo de desarrollo.
CMD ["sh", "-c", "pnpm exec prisma db push --skip-generate && node dist/main"]
