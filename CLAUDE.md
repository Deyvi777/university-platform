# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

University platform for "Certificate", a postgraduate institution (maestrías/diplomados) in Bolivia. UI copy is in Spanish. pnpm workspaces monorepo: `frontend/` (Next.js 16 + React 19 + Tailwind v4 + NextAuth v5 + shadcn/ui) and `backend/` (NestJS 11 + Prisma 7 + Zod). Infra via `docker-compose.yml`: PostgreSQL 18, Redis, Garage (S3-compatible).

## Commands

```bash
docker compose up -d                  # infra first (postgres :5432, redis :6379, garage :3900)
pnpm install                          # from root, installs all workspaces
pnpm dev                              # frontend :3000 + backend :4000 + Prisma Studio :51212 (DB viewer)
pnpm dev:frontend / pnpm dev:backend  # one app only
pnpm build / pnpm lint                # all workspaces
pnpm --filter backend test                       # backend unit tests (jest)
pnpm --filter backend test -- auth.service      # single test by pattern
pnpm --filter backend test:e2e
pnpm --filter backend prisma migrate dev        # after schema.prisma changes
```

Env setup: copy `backend/.env.example` → `backend/.env` (set `JWT_SECRET`) and `frontend/.env.example` → `frontend/.env.local` (set `AUTH_SECRET`). Swagger at `http://localhost:4000/docs`.

`pnpm dev` runs the backend's `dev` script, which is `concurrently` over `nest start --watch` **and** `prisma studio -p 51212` (visual DB browser at `http://localhost:51212`). `pnpm dev:backend` (= `start:dev`) runs only Nest, no Studio.

pnpm 10 blocks postinstall scripts by default; allowed packages live in root `package.json` `pnpm.onlyBuiltDependencies` — extend it if a new native dep (e.g. bcrypt) fails to build.

## Architecture

### Auth flow (the core cross-app contract)

The **backend is the source of truth for identity and RBAC**. NextAuth does not manage users:

1. Frontend NextAuth v5 Credentials provider (`frontend/src/auth.ts`) POSTs to backend `/auth/login`.
2. Backend (`backend/src/auth/`) validates with Prisma + argon2 and signs a JWT (`sub`, `email`, `role`).
3. That JWT is stored in the NextAuth session as `session.accessToken` (jwt/session callbacks in `frontend/src/auth.config.ts`; types augmented in `frontend/src/types/next-auth.d.ts`). API calls send it as `Authorization: Bearer`.
4. Backend guards: `JwtAuthGuard` + `RolesGuard` with `@Roles(...)` decorator (`backend/src/common/`). Roles are the Prisma enum `Role`: `ADMIN | PROFESSOR | STUDENT`.
5. **"Recordarme" (login)** controls session lifetime. Checked → backend signs a 30-day token (`JWT_REMEMBER_EXPIRES_IN`, default `30d`) and the NextAuth session cookie stays persistent; unchecked → 1-day token (`JWT_EXPIRES_IN`) **and** the login server action downgrades the session cookie to a _session cookie_ (no `Max-Age`, cleared on browser close). The `remember` flag flows `login-form.tsx` → `auth.ts` → `POST /auth/login`; the cookie downgrade lives in `frontend/src/app/login/actions.ts` (`signIn(..., { redirect: false })` then re-set the `authjs.session-token` cookie without expiry). `session.maxAge` (`auth.config.ts`) is the 30-day upper bound; the real expiry is gated by decoding the backend token's `exp` (see `frontend/AGENTS.md`).

### Next.js 16 specifics (frontend)

- **Read `frontend/node_modules/next/dist/docs/` before writing Next.js code** — APIs differ from training data (see `frontend/AGENTS.md`).
- Middleware is `src/proxy.ts` (not `middleware.ts`). It must import only `src/auth.config.ts` (edge-safe, no providers/Node APIs), never `src/auth.ts`. Route protection happens in the `authorized` callback.
- `trustHost: true` in `auth.config.ts` is required (self-hosted Auth.js); don't remove it.

### Prisma 7 specifics (backend)

- The client **requires a driver adapter**: `PrismaService` (`backend/src/prisma/prisma.service.ts`) passes `new PrismaPg(...)` to the constructor. `new PrismaClient()` without options throws.
- Datasource URL lives in `backend/prisma.config.ts`, not in `schema.prisma` — the `datasource db` block must have **only** `provider` (no `url = env(...)`), or `prisma migrate dev` fails with `P1012: The datasource property url is no longer supported in schema files`.
- After editing `schema.prisma`, run `pnpm --filter backend exec prisma migrate dev --name <x>` then **restart the backend** — the running `nest start --watch` process keeps the previously loaded `@prisma/client` in memory, so a regenerated client (new models/fields) isn't picked up until restart (`TS2339: Property 'x' does not exist on type 'PrismaService'`).
- `prisma.config.ts` is excluded in `tsconfig.build.json` — if it gets re-included, the build output nests under `dist/src/` and `node dist/main` breaks.

### Backend conventions

- Validation is Zod via `nestjs-zod`: DTOs are `class X extends createZodDto(schema)`; a global `ZodValidationPipe` is registered as `APP_PIPE` in `app.module.ts`. Do not introduce class-validator.
- `PrismaModule` and `QueueModule` (BullMQ over `REDIS_URL`) are `@Global()` — inject `PrismaService` directly; register queues with `BullModule.registerQueue(...)`.
- A global `ThrottlerGuard` is active (100 req/min).
- **Public/admin module pattern** (`programs`, `partners`, `categories`, `settings`): each domain exposes a public controller with no guards (`findAll`/`findBySlug` — only published/active rows, trimmed `select`) plus an `Admin*Controller` under `/admin/...` guarded by `JwtAuthGuard, RolesGuard` + `@Roles(Role.ADMIN)` (`findAllAdmin`/`findOneAdmin`/`create`/`update`/`remove`, full rows). Follow this split for new content-management domains.
- **Site settings** (`backend/src/settings/`): singleton config row (`SiteSettings`, table `site_settings`, fixed id `"singleton"`) holding the landing's social links (`facebook`/`instagram`/`linkedin`/`youtube`/`tiktok`/`whatsapp`). `GET /settings` (public, social fields only); `GET /admin/settings` + `PATCH /admin/settings` (ADMIN). Service uses `upsert` by id `"singleton"` so the row self-creates; the Zod DTO normalizes empty string → `null` and validates non-empty values as URLs. Extend this row (don't add new tables) for other global landing data.
- **Program categories** (`backend/src/categories/`): `ProgramCategory` is a managed table (`program_categories`), not an enum — admins create/edit/reorder categories and assign each `Program.categoryId` to one. Slugs are auto-generated from `name` via `slugify` (`backend/src/common/utils/slugify.ts`) with a numeric-suffix retry loop for uniqueness. Deleting a category with `programs.count > 0` throws `ConflictException` (409).
- **Users / admin user management** (`backend/src/users/`): **admin-only** module (no public controller) following the `Admin*` pattern — `/admin/users` (`JwtAuthGuard, RolesGuard` + `@Roles(Role.ADMIN)`) with `findAll(?role=)`/`findOne`/`create`/`update`/`remove`. Creates **PROFESSOR or STUDENT accounts only** (the Zod DTO's `role` enum excludes `ADMIN` → `400`; duplicate email → `409`). Passwords are argon2-hashed; **every response uses a `safeSelect` that omits the password hash**. This is the admin counterpart to `/auth/login`: the ADMIN creates the accounts that PROFESSOR/STUDENT later use.
- **Storage module** (`backend/src/storage/`): `POST /uploads?folder=...` (ADMIN only, multipart, 5 MB limit, image-mime allowlist) uploads to Garage (S3) and returns a **relative** path `/files/<folder>/<uuid>.<ext>`; `GET /files/:folder/:filename` streams it back publicly. Admin forms (flyers, partner logos, teacher photos) store this returned path in `flyerUrl`/`logoUrl`/`photoUrl`. **Return relative, never absolute** (`http://localhost:4000/...`): the frontend proxies `/files/*` to the backend via `rewrites()` in `next.config.ts` so `next/image` treats uploads as local images — Next 16's image optimizer rejects remote URLs that resolve to private IPs like `localhost` (`"url" parameter is not allowed` / `resolved to private ip`).

### Infra gotchas

- Garage's `command` needs the `--default-bucket` flag for the `GARAGE_DEFAULT_*` env vars to auto-create the bucket/key. S3 clients must use `endpoint: http://localhost:3900` with `forcePathStyle: true` (creds in `backend/.env` `S3_*`).
- Postgres auth method is baked into the volume at first init — changing auth-related env vars in docker-compose requires recreating the `postgres_data` volume.
- **macOS port 5432 conflict:** if Postgres.app (or any local Postgres) is running, it binds `127.0.0.1:5432`/`[::1]:5432` ahead of Docker's wildcard bind, so the backend connects to the _wrong_ server (`P1010 / role "university_user" does not exist`) even though `psql` via Docker works. Stop the local one: `pg_ctl -D "~/Library/Application Support/Postgres/var-16" stop`. Disable its autostart to avoid recurrence.

### Frontend conventions

- Landing components in `src/components/landing/`; static assets in `public/landing/`. Design rules (palette, typography, component patterns) are in `frontend/DESIGN.md` — follow it for any landing/UI work.
- React Query provider wraps the app in `layout.tsx`; shadcn/ui is initialized (add components with `pnpm dlx shadcn@latest add <name>`).
- Public content fetchers live in `src/lib/api/*.ts` (e.g. `programs.ts`, `partners.ts`, `settings.ts`) and use `fetch(..., { next: { revalidate: 300 } })` (ISR) against `API_URL`/`NEXT_PUBLIC_API_URL`. Footer/settings fetchers swallow backend errors and return safe defaults so the landing never breaks.
- **Footer** (`src/components/landing/footer.tsx`, server component): renders logo + social icons from `GET /settings`, showing **only** networks with a non-empty link (`SOCIAL_DEFS.filter(...)`). `lucide-react` has no brand icons here, so brand glyphs are inline simple-icons SVG paths (same approach as the CTA WhatsApp icon).
- **Image upload field** (`src/components/admin/image-upload-field.tsx`): POSTs to `/api/admin/upload` (route handler that forwards to backend `/uploads` with the user's bearer token) and stores the returned relative `/files/...` path. Shows an instant local preview via `URL.createObjectURL` (revoked on cleanup) with a spinner overlay while uploading.
- Navbar "Programas" dropdown links to `/?categoria=<slug>#programas`; `programs-grid.tsx` reads `useSearchParams()` (wrapped in `<Suspense>`) to preselect that category tab. When syncing URL→state, adjust during render comparing the previous param (React's recommended pattern), not in `useEffect` (the `react-hooks/set-state-in-effect` lint rule forbids it).
- **Dashboard (`src/app/dashboard/`) is role-aware.** The home (`page.tsx`) calls `requireUser()` (`src/lib/auth-guard.ts`, authenticates without gating role) and branches on `session.user.role`: ADMIN sees link-cards grouped ("Personas" + "Gestión del sitio · Landing"); PROFESSOR/STUDENT get a polished placeholder (`coming-soon-home.tsx`) since their features (cursos/módulos/kardex, inscripciones/notas) don't exist yet. The nav is role-gated via `dashboard/nav-items.ts` (`navItemsForRole(role)`), consumed by `layout.tsx`. **Admin sub-pages still call `requireAdmin()`** (redirects to `/login` if unauthenticated, to `/` if not `ADMIN`).
- **Admin sections**: reads go through `src/lib/api/admin.ts` (`adminFetch` + `parse`, throwing `AdminApiError` with the backend's status/message — catch `error.status === 404` for `notFound()`). Writes are server actions in each section's `actions.ts`, calling `mutateAdmin(method, path, body)` and then `revalidatePath(...)` for every affected route (landing `/`, the admin list, and any cross-referencing route, e.g. category mutations revalidate `/dashboard/programas` too). Sections so far: `programas`, `categorias`, `partners`, `configuracion` (social links → footer), `usuarios` (create/list/edit PROFESSOR & STUDENT via `/admin/users`; role filter by URL `?rol=docentes|estudiantes`, no `useSearchParams`). Add new ones as a folder (`page.tsx` + `actions.ts`, plus `*-schema.ts`/`*-form.tsx`) with a role-gated item in `dashboard/nav-items.ts` and (if ADMIN) a card in the role-aware home.
- Landing program categories/tabs (`programs-grid.tsx`) are derived dynamically from each program's `category` (`{ id, name, slug }`, sourced from `/categories`) — never hardcode category labels/enums.
