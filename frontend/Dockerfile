# Frontend (Next.js 16, output standalone). Contexto de build = raíz del monorepo:
#   docker build -f frontend/Dockerfile --build-arg NEXT_PUBLIC_API_URL=... .
FROM node:22-bookworm-slim AS build

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/package.json
RUN pnpm install --frozen-lockfile --filter frontend

COPY frontend frontend

# NEXT_PUBLIC_API_URL se inlinea en el bundle del navegador (dominio público
# del API). API_URL queda horneado en el rewrite de /files/* y debe apuntar al
# backend por la red interna de Docker (http://backend:4000).
ARG NEXT_PUBLIC_API_URL
ARG API_URL=http://backend:4000
# Umami (analíticas self-hosted): URL del script + website id, se inlinean
# en el bundle. Vacíos → no se inyecta el script (dev/builds locales).
ARG NEXT_PUBLIC_UMAMI_SRC
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
# AUTH_SECRET de relleno solo para que `next build` no falle al evaluar
# NextAuth; el valor real llega por variable de entorno en runtime.
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    API_URL=$API_URL \
    NEXT_PUBLIC_UMAMI_SRC=$NEXT_PUBLIC_UMAMI_SRC \
    NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID \
    AUTH_SECRET=build-placeholder-secret \
    NEXT_TELEMETRY_DISABLED=1

RUN cd frontend && pnpm build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# El build standalone reproduce la estructura del monorepo: server.js queda
# bajo frontend/ dentro del directorio standalone.
COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static ./frontend/.next/static
COPY --from=build /app/frontend/public ./frontend/public

EXPOSE 3000
CMD ["node", "frontend/server.js"]
