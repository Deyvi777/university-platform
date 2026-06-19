# DESIGN.md — Reglas de diseño del proyecto

Guía de diseño de **Certificate** (escuela de postgrado en Bolivia; todo el copy en **español / es-BO**). El proyecto tiene **dos lenguajes de diseño deliberadamente distintos**, según la audiencia y el propósito de cada superficie:

|                      | **Parte 1 · Landing** (público / marketing)        | **Parte 2 · Plataforma educativa** (autenticado / operativo) |
| -------------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| Propósito            | Persuadir, comunicar prestigio, captar interesados | Operar: gestionar contenido, cursos, módulos, kardex         |
| Tema                 | **Oscuro** (`slate-950`/`slate-900`)               | **Claro** (tema shadcn `neutral`)                            |
| Tono                 | Dramático, editorial, espacioso                    | Funcional, sobrio, denso en datos pero legible               |
| Acento institucional | `amber-400`                                        | `amber-500`                                                  |
| Tipografía           | Geist Sans, titulares grandes                      | Geist Sans, jerarquía compacta                               |
| Componentes          | Elementos nativos estilizados a mano               | **shadcn/ui**                                                |
| Rutas                | `/`, `/programas/[slug]`                           | `/login`, `/dashboard/*`                                     |
| Rige                 | Esta guía (Parte 1)                                | Esta guía (Parte 2) **+ skill `ui-educativa`**               |

**Lo compartido por ambos mundos:** la marca (Certificate), el idioma (es-BO), la fuente (**Geist Sans**, `--font-geist-sans`) y el **acento ámbar institucional** usado con moderación. El **logo blanco** (`public/landing/logo.webp`) solo funciona sobre fondo oscuro en los dos — nunca sobre claro. **No mezclar los dos temas dentro de una misma pantalla.** El login (`/login`) es la pantalla puente y usa elementos de ambos (ver Parte 2).

---

# Parte 1 — Landing page (sitio público de marketing)

Tema oscuro, editorial. Toda nueva sección de la landing debe seguir estas reglas para mantener consistencia.

## Identidad

- Institución académica de postgrado: el tono visual es **sobrio, elegante y profesional**. Nada de colores estridentes ni elementos juguetones.
- Todo el copy en **español**.
- El logo (`public/landing/logo.webp`) es **blanco**: solo funciona sobre fondos oscuros. Nunca colocarlo sobre fondo claro.

## Paleta

| Uso                                         | Clase Tailwind                               |
| ------------------------------------------- | -------------------------------------------- |
| Fondo base / superficies oscuras            | `slate-950`, `slate-900`                     |
| Texto principal sobre oscuro                | `white`                                      |
| Texto secundario sobre oscuro               | `slate-200` (párrafos), `slate-300` (labels) |
| **Acento institucional** (CTAs, highlights) | `amber-400`, hover `amber-300`               |
| Texto sobre acento ámbar                    | `slate-950` (nunca blanco)                   |
| Bordes y separadores "glass"                | `white/10` a `white/25`; hover `white/60`    |

El ámbar se usa con moderación: un highlight en el titular, el CTA primario y detalles puntuales (dot del badge). No teñir secciones enteras de ámbar.

## Tipografía

- Fuente: **Geist Sans** (variable `--font-geist-sans`, ya configurada en `layout.tsx`); `Geist Mono` solo para código/datos si hiciera falta.
- Titulares: `font-bold tracking-tight leading-tight`, escala responsiva `text-4xl sm:text-5xl lg:text-6xl`.
- Párrafos: `text-lg leading-8`, ancho máximo de lectura `max-w-xl`.
- Labels/metadata: `text-sm` (o `text-xs sm:text-sm` en grids angostos).

## Componentes y patrones

- **Botones**: siempre `rounded-full`.
  - Primario: fondo `amber-400`, texto `slate-950 font-semibold`, sombra `shadow-amber-400/20`.
  - Secundario: outline `border-white/30` + `backdrop-blur-sm`, hover `bg-white/10`.
- **Badge/eyebrow**: pill con `border-white/15 bg-white/5 backdrop-blur-sm`, dot `amber-400` y texto `amber-300`.
- **Navbar**: fijo (`fixed top-0 z-50`), transparente sobre el hero y al hacer scroll (>24px) pasa a `bg-slate-950/85 backdrop-blur-md border-b border-white/10`. Altura `h-20`. Colapsa a hamburguesa bajo `lg`.
- **Contenedor**: `mx-auto max-w-7xl px-6 lg:px-8` en todas las secciones.

## Imágenes y video

- Video de fondo: `autoPlay muted loop playsInline`, `object-cover` absoluto.
- **Siempre** colocar overlays de gradiente sobre media para garantizar contraste del texto: lateral `from-slate-950/90 via-slate-950/70 to-slate-950/40` + fade inferior `from-slate-950/90 to-transparent`.
- Assets en `public/landing/` con nombres **kebab-case sin espacios** (`hero-video.mp4`).

## Espaciado y ritmo

- Secciones generosas: hero `min-h-svh`, padding superior `pt-32` (despeja el navbar fijo).
- Ritmo vertical interno: `mt-6` (sub-bloques), `mt-10` (CTAs), `mt-16` (stats/separadores con `border-t border-white/15 pt-8`).

## Responsive

- Breakpoint de navegación: `lg` (links y CTAs visibles ≥1024px; hamburguesa debajo).
- CTAs en fila con `flex flex-wrap gap-4` para que envuelvan en pantallas angostas.
- Grids de datos: reducir tamaño y gap en móvil (`gap-4 sm:gap-6`, `text-2xl sm:text-3xl`).

## Accesibilidad

- Botones de solo ícono llevan `aria-label` (y `aria-expanded` si abren menús).
- Imágenes con `alt` descriptivo; el logo enlaza a `/` con `aria-label`.
- El contraste del texto sobre media se garantiza con los overlays — no confiar en el frame del video.

## Estructura de archivos

- Componentes de la landing en `src/components/landing/` (un archivo por sección: `navbar.tsx`, `hero.tsx`, `programs.tsx`, `programs-grid.tsx`, `partners.tsx`, `cta.tsx`, `footer.tsx`). Orden en `page.tsx`: Navbar → Hero → Programs → Partners → Cta → Footer.
- `page.tsx` solo compone secciones; el contenido vive en los componentes.
- shadcn/ui está disponible (`src/components/ui/`) para piezas interactivas; para la landing se prefieren elementos nativos estilizados con las reglas de arriba.
- Secciones con datos de la API (`programs.tsx`, `partners.tsx`) son server components `async` que hacen `fetch` con manejo de errores en `try/catch` — si el backend no responde, la sección se renderiza vacía/oculta en vez de romper la landing.

## Sección "Programas" y página de detalle

- **Tabs de categoría** (`programs-grid.tsx`, client component): se generan dinámicamente a partir de las categorías presentes en `programs[].category` (más un tab "Todos" inicial) — nunca hardcodear nombres de categoría. Tab activo: `bg-amber-400 text-slate-950`; inactivo: `border-white/15 text-slate-300 hover:border-white/40`.
- **Cards de programa**: `<Link>` con flyer en `aspect-[4/5] rounded-2xl` (`<Image fill className="object-cover" />`, los flyers tienen ratios heterogéneos), overlay de gradiente inferior, badge de categoría (`category.name`), título, fecha de inicio + modalidad, "Ver más →" en ámbar.
- **Página de detalle** (`/programas/[slug]`, tema oscuro): header en grid 2 columnas (badge + h1 + objetivo + CTA | flyer); ficha rápida en 4 tarjetas glass (`border-white/10 bg-white/5 rounded-2xl`) para modalidad/inicio/duración/horarios; malla académica por módulos; plantel docente en grid de tarjetas; tarjeta de inversión destacada con `border-amber-400/30`. Fechas siempre con `Intl.DateTimeFormat("es-BO", { timeZone: "UTC" })` para evitar desajustes de hidratación.
- `not-found.tsx` temático para `/programas/[slug]` con CTA de vuelta a `/#programas`.
- **Deep-link de categoría**: el dropdown "Programas" del navbar enlaza a `/?categoria=<slug>#programas`; `programs-grid.tsx` lee el query param (`useSearchParams`, envuelto en `<Suspense>`) para preseleccionar ese tab. El usuario puede cambiar de tab manualmente.

## Sección CTA (`cta.tsx`)

- Sección `id="contacto"` con **imagen de fondo** a sangre completa (`CTA-image.webp`, graduación al atardecer) vía `<Image fill className="object-cover" />`.
- Overlays obligatorios para legibilidad (texto a la izquierda, sobre el espacio negativo): lateral `from-slate-950 via-slate-950/80 to-slate-950/25` + base `from-slate-950 ... to-slate-950/55`. Un `blur` ámbar (`bg-amber-400/[0.12]`, `animate-pulse-glow`) sobre el sol integra la paleta.
- Título con la palabra de acento en gradiente ámbar animado (`bg-clip-text text-transparent animate-gradient`), `drop-shadow-sm` para destacar sobre la foto. Botón primario con brillo que cruza en hover. Las figuras decorativas/animaciones nunca deben competir con la foto ni reducir el contraste del texto.

## Footer (`footer.tsx`)

- Server component sobre `bg-slate-950` con `border-t border-white/10` y acento ámbar superior sutil (hairline `via-amber-400/50` + glow tenue). Contenedor estándar `max-w-7xl`.
- Layout: grid `lg:grid-cols-[1.5fr_1fr_1fr]` — columna de marca (logo blanco + tagline + iconos de redes) y columnas de navegación; barra inferior con copyright separada por `border-t border-white/10 pt-8`.
- **Iconos de redes sociales**: provienen de `GET /settings`; se renderiza **solo** el icono de cada red con enlace no vacío. Botón circular glass (`h-10 w-10 rounded-full border-white/10 bg-white/5`), hover `border-amber-400/50 bg-amber-400/10 text-amber-300` + `-translate-y-0.5`. `lucide-react` **no** trae iconos de marcas: usar paths inline de simple-icons (viewBox 24×24), igual que el icono de WhatsApp del CTA. Cada `<a>` decorativo lleva `aria-label`.

## Animaciones (`globals.css`, `@theme`)

- Definidas como variables Tailwind v4 (`--animate-*` + `@keyframes`): `marquee` (carrusel de partners), `pulse-glow` (resplandores ámbar) y `gradient` (texto/acento animado). Añadir nuevas con el mismo patrón.
- **Toda** animación debe desactivarse bajo `@media (prefers-reduced-motion: reduce)` (bloque al final de `globals.css`). Borrar el keyframe correspondiente si una animación deja de usarse (no dejar CSS muerto).

---

# Parte 2 — Plataforma educativa (áreas autenticadas)

Tema **claro**, funcional. Aplica a `/login` y a todo el panel `src/app/dashboard/` (gestión de contenido hoy; cursos, módulos y kardex a futuro). El **UI/UX detallado** — metodología, matriz de estados, formularios, tablas, vistas académicas, checklist de calidad — se rige por la skill de proyecto **`ui-educativa`** y el agente `UI/UX-designer`. Esta parte fija la **identidad visual y los patrones base** del área interna.

## Identidad

- Mismo tono sobrio y profesional de la marca, pero orientado a la **tarea**, no a la persuasión: claridad, escaneabilidad y densidad de datos legible (listas de programas, notas, kardex). Referencia mental: productos educativos serios (Canvas, Notion-for-edu).
- **Tema claro por defecto** — mejor para lectura prolongada de datos académicos que el oscuro dramático de la landing.
- El logo blanco sigue la regla global: solo sobre oscuro (por eso en el área interna aparece sobre pills/paneles **azul oscuro** `blue-950` (navy institucional `#172554`) puntuales, p. ej. el panel de marca del login). El **navy `blue-950` es el único fondo oscuro de la plataforma** — no usar `slate-950` (ese es el oscuro de la landing).

## Paleta

Tema shadcn **`base-nova` / `neutral`** con CSS variables (tokens `oklch` en `src/app/globals.css`). Usar los **tokens semánticos**, no colores Tailwind crudos, salvo el acento ámbar.

| Uso                                                         | Token / clase                                                                                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Fondo de página                                             | `bg-muted/30`                                                                                                                                   |
| Superficies / tarjetas                                      | `bg-card` (header: `bg-background`) + `border` + `rounded-xl`                                                                                   |
| Texto principal                                             | `text-foreground`                                                                                                                               |
| Texto secundario / metadata                                 | `text-muted-foreground`                                                                                                                         |
| Hover de nav / superficies                                  | `bg-muted`                                                                                                                                      |
| **Superficie de marca oscura** (panel/pill con logo blanco) | **`bg-blue-950`** (navy institucional `#172554`) — único fondo oscuro del área interna; aloja el logo blanco + acentos ámbar. Nunca `slate-950` |
| **Acento institucional**                                    | `amber-500` (hover `amber-400`); texto sobre ámbar `slate-950`                                                                                  |
| Acción destructiva                                          | variante `destructive` de shadcn (`text-destructive`, `border-destructive/30`, `bg-destructive/10`)                                             |

Mismo principio de moderación con el ámbar: CTA primario, highlights de marca (`Certificate · Panel`) e iconos puntuales — no teñir superficies enteras.

## Tipografía

- Misma **Geist Sans** (compartida con la landing), pero con **jerarquía compacta** (no titulares gigantes):
  - Título de página: `text-2xl font-bold tracking-tight`.
  - Subtítulo/descripción: `text-muted-foreground` (`text-sm`/`text-base`).
  - Labels y metadata: `text-sm`.
- Números (notas, montos, conteos, créditos): `tabular-nums`, alineados a la derecha en tablas.

## Layout y navegación

- **Header horizontal** superior (`border-b bg-background`, `h-16`): marca **"Certificate · Panel"** (`· Panel` en `text-amber-500`), `nav` de items `icono lucide + label` (`text-muted-foreground`, hover `bg-muted hover:text-foreground`), a la derecha el email del usuario + botón **"Salir"** (`variant="outline" size="sm"`, server action `signOut({ redirectTo:"/login" })`). Ver `src/app/dashboard/layout.tsx`.
- **Contenedor**: `mx-auto max-w-6xl px-6`; `main` con `py-8`. (Más angosto que el `max-w-7xl` de la landing: el contenido interno es funcional, no de display.)
- La nav se oculta bajo `sm` (`hidden sm:flex`). **La nav es role-aware**: los items salen de `navItemsForRole(role)` en `dashboard/nav-items.ts` (fuente única de verdad), consumido por `layout.tsx`. Cada sección nueva agrega su item ahí, gateado por rol — no muestres acciones que el rol no puede ejecutar.

## Home del panel (role-aware)

La home `/dashboard` (`page.tsx`) autentica con `requireUser()` (sin gate de rol) y **ramifica por `session.user.role`**:

- **ADMIN** → tarjetas-enlace agrupadas por secciones con encabezado (`HomeSection`): **"Personas"** (Usuarios) y **"Gestión del sitio · Landing"** (Programas, Categorías, Aliados, Redes sociales). Cada tarjeta: icono lucide en cuadro de **tinte ámbar** (`bg-amber-500/10 ring-amber-500/20`) — peso visual sin teñir la tarjeta entera —, título, descripción, conteo opcional (`tabular-nums`) y flecha que entra en hover, con `focus-visible:ring` ámbar.
- **PROFESSOR / STUDENT** → estado vacío **intencional** (`coming-soon-home.tsx`): saludo con su nombre, badge "Próximamente", icono `Sparkles`, y chips de lo que llegará (docente: cursos/módulos/kárdex; estudiante: inscripciones/kárdex/calificaciones). **Sin CTA falso.** Cuando esas pantallas existan, se añade su item a `nav-items.ts` y se reemplaza el branch.

## Sección "Usuarios" (`/dashboard/usuarios`, solo ADMIN)

Gestión de cuentas de docentes y estudiantes (backend `/admin/users`). **Listado** en tabla shadcn con badges semánticos sobrios diferenciados (Docente `sky` / Estudiante `violet` / Activo `emerald`) — el **ámbar queda reservado** para Administrador y la acción primaria. **Filtro por rol vía URL** (`?rol=docentes|estudiantes`) con pills tipo tablist (`aria-current`), filtrado **server-side** (sin `useSearchParams`, así la página es server component puro). **Formulario** crear/editar (`user-form.tsx` + `user-schema.ts` que espeja el DTO): nombre, apellido, correo, contraseña (toggle mostrar/ocultar como el login), **selector de Rol** (Profesor/Estudiante). El **409** (correo duplicado) se muestra inline en el campo + banner + toast, nunca crashea.

## Componentes y patrones

- **Botones**: primitivos de shadcn (`Button`) — **no** el `rounded-full` de la landing. Primario con acento `bg-amber-500 text-slate-950 hover:bg-amber-400`; secundario `variant="outline"`; destructivo `variant="destructive"`; `size="sm"` en barras de acciones.
- **Tarjetas**: `rounded-xl border bg-card p-6`; tarjetas-enlace (home del panel) con `hover:border-amber-400` + flecha que aparece en hover.
- **Formularios**: shadcn `Form`/`Input`/`Label` + esquema **Zod** en `*-schema.ts` que **espeja el DTO Zod del backend**; errores inline con `aria-invalid`/`aria-describedby`; submit con estado `pending` (deshabilitado + `Loader2`). Imágenes con `src/components/admin/image-upload-field.tsx` (guarda ruta relativa `/files/...`).
- **Tablas / listas**: shadcn `Table`; jerarquía de columnas (identidad → estado como **badge** semántico → acciones al final con `dropdown-menu`); `AlertDialog` para acciones destructivas, mostrando con gracia el `409 Conflict` del backend (p. ej. borrar categoría en uso).
- Reusar siempre primitivos de shadcn (`src/components/ui/`); añadir los que falten con `pnpm dlx shadcn@latest add <name>`. **No** introducir otro UI kit ni el lenguaje glass-oscuro de la landing.

## Estados (matriz obligatoria)

Ninguna pantalla interna es solo "happy path". Manejar explícitamente: **cargando** (`Skeleton`), **vacío** (icono + mensaje es-BO + CTA), **error** (capturar `AdminApiError`: `404 → notFound()`, `401 →` redirección a `/api/auth/session-expired`), **conflicto 409**, **validación** inline, **pending**, **éxito** (toast). El detalle por tipo de pantalla y el checklist de calidad están en la skill **`ui-educativa`**.

## Login (`/login`) — pantalla puente

- Layout **split-panel**: panel de marca **izquierdo** **azul oscuro `bg-blue-950`** (navy institucional `#172554`; único sitio válido para el **logo blanco** + propuesta de valor + bullets con iconos `amber-400`) y panel **derecho** claro (`bg-muted/30`) con el formulario. En `<lg` el panel de marca se oculta y se muestra un logo compacto sobre pill `bg-blue-950`. El par **navy + ámbar** es el estándar cromático de toda superficie oscura de la plataforma: el ámbar, al ser complementario del azul, resalta mejor sobre el navy que sobre el casi-negro `slate-950` (reservado a la landing). Ver `src/app/login/page.tsx`.
- **Estado "sesión expirada"** (`/login?expired=1`): banner `role="status"` ámbar ("Tu sesión expiró. Inicia sesión nuevamente para continuar."). El flujo técnico que lo origina (Route Handler `signOut` que rompe el bucle de redirección por token vencido) está en `frontend/AGENTS.md` y CLAUDE.md.
- El input de **correo es controlado** para sobrevivir al reset de `<form action>` de React 19 (re-sembrado desde la server action ante un intento fallido — ver AGENTS.md). Toggle de mostrar/ocultar contraseña con `aria-label`/`aria-pressed`. **"Recordarme"** controla la persistencia de la sesión: marcado → cookie persistente + token backend de 30 días (`JWT_REMEMBER_EXPIRES_IN`); sin marcar → cookie de sesión (se borra al cerrar el navegador) + token de 1 día. La server action `authenticate` rebaja la cookie a sesión-only cuando no se marca (ver `src/app/login/actions.ts`).

## Accesibilidad

Misma exigencia que en la landing: HTML semántico, `<label>` asociados (`useId`), foco visible (`focus-visible:ring`), `aria-*` en iconos/toggles, contraste suficiente del tema claro, y respeto de `prefers-reduced-motion`.

## Estructura de archivos

- **Panel**: `src/app/dashboard/` con `layout.tsx` (header + nav) y **una carpeta por sección** = `page.tsx` (server component, llama `requireAdmin()`) + `actions.ts` (server actions) + `*-schema.ts` + `*-form.tsx`. Lecturas vía `src/lib/api/admin.ts`; escrituras vía `mutateAdmin(...)` + `revalidatePath(...)` de cada ruta afectada. Guard: `requireAdmin()` (`src/lib/auth-guard.ts`).
- **Login**: `src/app/login/` (`page.tsx` + `login-form.tsx` + `actions.ts`) y el Route Handler `src/app/api/auth/session-expired/route.ts`.
- Convenciones completas del panel admin (split público/admin, `adminFetch`/`AdminApiError`, server actions): ver **CLAUDE.md → Frontend conventions → Admin panel**.
