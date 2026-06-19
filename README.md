# University Platform

Plataforma universitaria — monorepo con pnpm workspaces.

## Stack

| Capa     | Tecnología                                                                             |
| -------- | -------------------------------------------------------------------------------------- |
| Frontend | Next.js 16 · React 19 · Tailwind CSS v4 · NextAuth (Auth.js v5)                        |
| Backend  | NestJS 11 · Prisma 7 (`@prisma/adapter-pg`) · JWT/RBAC (Passport) · Zod (`nestjs-zod`) |
| Datos    | PostgreSQL 18 · Redis · Garage (S3-compatible)                                         |
| Infra    | Docker Compose                                                                         |

## Requisitos

- Node.js ≥ 22, pnpm ≥ 10, Docker

## Puesta en marcha

```bash
# 1. Infraestructura (Postgres, Redis, Garage con bucket "university-files" automático)
docker compose up -d

# 2. Dependencias (todo el workspace)
pnpm install

# 3. Variables de entorno
cp backend/.env.example backend/.env      # completar JWT_SECRET: openssl rand -hex 32
cp frontend/.env.example frontend/.env.local  # completar AUTH_SECRET: npx auth secret

# 4. Migraciones
pnpm --filter backend prisma migrate dev

# 5. Desarrollo (frontend :3000 + backend :4000)
pnpm dev
```

## Scripts (raíz)

| Comando                                  | Acción                         |
| ---------------------------------------- | ------------------------------ |
| `pnpm dev`                               | Frontend + backend en paralelo |
| `pnpm dev:frontend` / `pnpm dev:backend` | Solo una app                   |
| `pnpm build`                             | Build de ambos                 |
| `pnpm lint` / `pnpm test`                | Lint / tests                   |

## Autenticación

- El backend NestJS emite el JWT (`POST /auth/login`) validando contra Prisma + argon2; el payload incluye `sub`, `email` y `role` (`ADMIN` / `PROFESSOR` / `STUDENT`).
- RBAC con `@Roles(...)` + `RolesGuard` (`backend/src/common/`).
- El frontend usa NextAuth v5 con Credentials provider que delega en el backend; el `accessToken` queda en la sesión para llamar a la API con `Authorization: Bearer`.
- En Next.js 16 el middleware se llama `proxy.ts` (`frontend/src/proxy.ts`) y protege `/dashboard`.

## API

Swagger disponible en `http://localhost:4000/docs` con el backend corriendo.

## Estructura

```
frontend/   Next.js (App Router, src/)
backend/    NestJS (auth, prisma, common en src/)
docker-compose.yml  postgres + redis + garage
```
