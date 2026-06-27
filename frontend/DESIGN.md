# DESIGN.md — Reglas de diseño del proyecto

Guía de diseño de **Certificate** (escuela de postgrado en Bolivia; todo el copy en **español / es-BO**). El proyecto tiene **dos lenguajes de diseño deliberadamente distintos**, según la audiencia y el propósito de cada superficie:

|                      | **Parte 1 · Landing** (público / marketing)            | **Parte 2 · Plataforma educativa** (autenticado / operativo) |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Propósito            | Persuadir, comunicar prestigio, captar interesados     | Operar: gestionar contenido, cursos, módulos, kardex         |
| Tema                 | **Oscuro** (`slate-950`/`slate-900`)                   | **Claro** (tema shadcn `neutral`)                            |
| Tono                 | Dramático, editorial, espacioso                        | Funcional, sobrio, denso en datos pero legible               |
| Acento institucional | `amber-400`                                            | `amber-500`                                                  |
| Tema por defecto     | —                                                      | **Oscuro (navy)** vía `next-themes` + toggle claro/oscuro    |
| Tipografía           | Open Sans (cuerpo) + Merriweather (titulares), grandes | Open Sans + Merriweather, jerarquía compacta                 |
| Componentes          | Elementos nativos estilizados a mano                   | **shadcn/ui**                                                |
| Rutas                | `/`, `/programas/[slug]`                               | `/login`, `/dashboard/*`                                     |
| Rige                 | Esta guía (Parte 1)                                    | Esta guía (Parte 2) **+ skill `ui-educativa`**               |

**Lo compartido por ambos mundos:** la marca (Certificate), el idioma (es-BO), la familia tipográfica (**Open Sans** para el cuerpo vía `--font-sans` y **Merriweather** para los titulares vía `--font-heading`; `Geist Mono` solo para datos/código — ver `layout.tsx`) y el **acento ámbar institucional** usado con moderación. El **logo blanco** (`public/landing/logo.webp`) solo funciona sobre fondo oscuro en los dos — nunca sobre claro. **No mezclar los dos temas dentro de una misma pantalla.** El login (`/login`) es la pantalla puente y usa elementos de ambos (ver Parte 2).

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

- Fuentes (configuradas en `layout.tsx`): **Open Sans** para el cuerpo (variable `--font-sans`) y **Merriweather** para los titulares (variable `--font-heading`, aplicada a `h1`–`h6` en `globals.css`); `Geist Mono` (`--font-geist-mono`) solo para código/datos si hiciera falta.
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

Panel `src/app/dashboard/` funcional (gestión de contenido + **capa académica completa**: cursos, módulos, contenido, entregas, calificación y kárdex), con **dos temas** — claro y oscuro (navy) — gobernados por `next-themes`. **El modo oscuro (navy) es el predeterminado** (ver "Tema y modo oscuro" abajo); el usuario puede alternar al claro con el `ThemeToggle` del topbar y su elección se persiste. El **login** (`/login`) es la **pantalla puente**: no usa los tokens de shadcn sino una superficie **navy sobre-imagen** fija (ver más abajo). El **UI/UX detallado** — metodología, matriz de estados, formularios, tablas, vistas académicas, checklist de calidad — se rige por la skill de proyecto **`ui-educativa`** y el agente `UI/UX-designer`. Esta parte fija la **identidad visual y los patrones base** del área interna.

## Identidad

- Mismo tono sobrio y profesional de la marca, pero orientado a la **tarea**, no a la persuasión: claridad, escaneabilidad y densidad de datos legible (listas de programas, notas, kardex). Referencia mental: productos educativos serios (Canvas, Notion-for-edu).
- **Modo oscuro (navy) por defecto, con toggle a modo claro** — el panel soporta ambos temas vía `next-themes` (clase `.dark` en `<html>`); el oscuro navy es el predeterminado para usuarios nuevos y la preferencia se guarda en `localStorage`. Ambos temas comparten el mismo lenguaje de marca (navy + ámbar) y solo difieren en la paleta de superficies (ver "Tema y modo oscuro").
- El logo blanco sigue la regla global: solo sobre oscuro (por eso en el área interna aparece sobre pills/paneles **azul oscuro** `blue-950` (navy institucional `#172554`) o sobre la imagen de fondo del login, p. ej. encima de la tarjeta glass del login). El **navy `blue-950` es el único fondo oscuro de la plataforma** — no usar `slate-950` (ese es el oscuro de la landing).

## Tema y modo oscuro

El panel es **claro/oscuro** vía `next-themes`. Integración (ver `src/components/providers/theme-provider.tsx`, montado en el root `layout.tsx` envolviendo a `QueryProvider` + `Toaster`):

- `attribute="class"` → alterna la clase `.dark` en `<html>` (el selector que usan los tokens de shadcn, `@custom-variant dark` en `globals.css`).
- `defaultTheme="dark"` + `enableSystem={false}` → **el modo oscuro (navy) es el predeterminado**, sin depender de la preferencia del SO. La elección del usuario se persiste en `localStorage` (lo hace next-themes) y sobreescribe el default en visitas posteriores.
- `disableTransitionOnChange` → evita el "barrido" de transiciones de color al cambiar de tema.
- El `<html>` del root layout lleva **`suppressHydrationWarning`** porque next-themes fija la clase del tema en el cliente antes de la hidratación (ver AGENTS.md).

**Toggle de tema** (`src/components/dashboard/theme-toggle.tsx`, client component, en el topbar): **píldora deslizante sol ⇄ luna**. Pista redondeada (gris claro en modo claro / navy `blue-950` en oscuro) con un `thumb` circular que se desliza con `transition-[transform,…]` y un _ease_ tipo "spring" (`cubic-bezier(0.34,1.56,0.64,1)`): claro → thumb a la izquierda, ámbar (`amber-500`) con icono SOL; oscuro → thumb a la derecha, azul (`blue-500`) con icono LUNA. Cross-fade + leve giro/escala de iconos. Es un `<button role="switch">` con `aria-checked` (true = oscuro), `aria-label` y foco visible ámbar; todas las transiciones se anulan con `motion-reduce:`. **Guard de hidratación**: usa `useTheme()` pero solo pinta el estado real una vez montado (`useMounted` con `useSyncExternalStore`, sin `useEffect`); antes muestra un placeholder del mismo tamaño para evitar mismatch SSR y CLS.

> **Dos paletas, un mismo lenguaje.** El **modo claro** sigue la tabla de la sección "Paleta" (colores del mockup). El **modo oscuro** (bloque `.dark` de `globals.css`) es **navy** (hue ~265): `background` navy casi negro (`~#0a0f1d`), `card`/`popover` un punto más claros (`~#111a30`), `muted`/`secondary` para hovers/chips, `foreground` blanco frío, bordes blancos al ~12–18% con tinte azul; contraste AA verificado. **Ojo:** en oscuro `--primary` **no** es azul sino una superficie clara de alto contraste (texto navy encima) para que los botones sólidos resalten sobre el fondo navy. Prefiere siempre **tokens semánticos** para que el estilo aplique a ambos modos; usa `dark:` solo donde un color claro no deba "voltear" (p. ej. anular sombras: `dark:shadow-none`). **El sidebar es navy en AMBOS modos** y no voltea (ver Sidebar abajo).

## Paleta — lenguaje "Certificate dashboard"

El área interna usa el lenguaje de diseño **"Certificate dashboard"** (sintetizado del mockup educativo de referencia "EDUCATION2025"): **azul de marca vivo + sidebar navy en gradiente + tarjetas blancas muy redondeadas con sombra suave sobre un lienzo gris frío**. Tokens `oklch` en `src/app/globals.css` con un **hue azul ~258–262** (gemelo del hue navy del modo oscuro). Usar **tokens semánticos**, no colores Tailwind crudos, salvo el acento ámbar y las superficies de marca navy.

> **Dos paletas, un mismo lenguaje:** el **modo claro** sigue la tabla de abajo (colores del mockup); el **modo oscuro** conserva la paleta **navy** ya implementada en el bloque `.dark` de `globals.css`, **intacta**. Prefiere siempre tokens semánticos para que el estilo aplique a ambos modos automáticamente; usa `dark:` solo donde un color claro no deba "voltear". **No** reintroducir la paleta grayscale `neutral` anterior.

| Uso                                                         | Token / clase                                                                                                                                                                                                                      |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lienzo de página                                            | `bg-background` — gris frío `#EEF1F5` (no blanco puro)                                                                                                                                                                             |
| Superficies / tarjetas                                      | `bg-card` (blanco) + `border` + **`rounded-2xl`** + sombra suave `shadow-sm shadow-blue-950/[0.04] dark:shadow-none`                                                                                                               |
| Texto principal / headings                                  | `text-foreground` — navy oscuro `#102A4C`                                                                                                                                                                                          |
| Texto secundario / metadata                                 | `text-muted-foreground` — gris azulado medio                                                                                                                                                                                       |
| **Acción primaria / pills activos / banners / progreso**    | **`bg-primary`** — azul de marca `#2563EB` (texto `text-primary-foreground` blanco)                                                                                                                                                |
| Hover de nav / chips / fondos sutiles                       | `bg-muted` / `bg-secondary` / `bg-accent` — gris azulado muy claro                                                                                                                                                                 |
| Bordes / inputs                                             | `border` / `border-input` — gris azulado tenue `#DDE3EC`                                                                                                                                                                           |
| **Sidebar (navy SIEMPRE, claro y oscuro)**                  | tokens `--sidebar*` + **color plano** (no gradiente perceptible): modo claro `blue-900`, modo oscuro `slate-950` (`dark:`); activo = **píldora translúcida** `bg-white/15` con **badge circular blanco** e icono en `text-primary` |
| **Superficie de marca oscura** (panel/pill con logo blanco) | **`bg-blue-950`** (navy institucional `#172554`) — único fondo oscuro del área interna; aloja el logo blanco + acentos ámbar. Nunca `slate-950`                                                                                    |
| **Acento institucional**                                    | `amber-500` sobre claro (hover `amber-400`) / `amber-300` sobre navy; texto sobre ámbar `slate-950`                                                                                                                                |
| Acción destructiva                                          | variante `destructive` de shadcn (`text-destructive`, `border-destructive/30`, `bg-destructive/10`)                                                                                                                                |

Mismo principio de moderación con el ámbar: CTA primario, highlights de marca (`Certificate · Plataforma`) e iconos puntuales — no teñir superficies enteras de azul ni de ámbar.

**Radios y sombras del lenguaje:** `--radius: 0.75rem`. Tarjetas/superficies de sección y wrappers de tabla = **`rounded-2xl`**; paneles de marca (sidebar, perfil) = `rounded-3xl`; botones-píldora, filtros y barras de búsqueda = **`rounded-full`**; chips de icono = `rounded-xl`. Sombras siempre **suaves y teñidas de navy** (`shadow-sm shadow-blue-950/[0.04]`), anuladas en oscuro (`dark:shadow-none`, basta el `ring`).

### Estructura del layout del dashboard

`dashboard/layout.tsx` arma **dos columnas en un flex raíz** (`flex min-h-screen bg-background`):

- **Izquierda:** el **sidebar navy a toda la altura de la pantalla** (`<aside sticky top-0 h-screen>`), **hermano** de la columna de contenido (no la envuelve). Por eso el topbar queda confinado a la derecha y nunca se extiende sobre el sidebar.
- **Derecha:** la **columna de contenido** (`DashboardShell`, `flex-1 flex-col`, client component) que contiene **arriba el topbar `sticky`** (confinado a este ancho) y **debajo** un grid scrolleable `main | panel de perfil` (la columna del panel de perfil solo aparece en `xl+` y si `profileOpen`).

### Sidebar (`dashboard-sidebar.tsx`)

- **Panel navy en AMBOS temas** (no voltea con el tema), **color plano** (sin gradiente perceptible): modo claro `blue-900` sólido, modo oscuro `slate-950` (`dark:`). Esquina derecha redondeada `rounded-r-3xl` tanto expandido como en el riel; `shadow-lg shadow-blue-950/10 ring-1 ring-white/5`.
- **Marca:** el **logo de Certificate** (`/landing/logo.webp`, blanco, vía `next/image`) va **directo sobre el navy** (`SidebarLogo`), reemplazando la antigua píldora/wordmark blanca. (El overlay móvil sí conserva un blob blanco con el wordmark "Certificate".)
- **Ítem activo:** **píldora translúcida** `bg-white/15` (`ring-1 ring-white/15`) con **badge circular blanco** (`size-9`) que aloja el icono en **azul de marca** (`text-primary` en claro; **`dark:text-blue-950`** en oscuro, porque en el tema oscuro `--primary` es casi blanco y se perdería sobre el badge blanco) — el detalle clave del mockup. **Inactivos:** icono + etiqueta en blanco con buen brillo (`text-sidebar-foreground/90`), hover translúcido sutil (`hover:bg-white/[0.07]`). Encabezados de sección como botones-acordeón en blanco atenuado uppercase.
- **Estados:** expandido (`w-60`) / **riel minimizado de ancho fijo (`w-18`) SIN expansión al hover** (el panel queda anclado a `w-18`; ya no se ensancha al pasar el cursor) / drawer móvil (overlay con secciones completas). Persistencia de colapso del sidebar y del panel de perfil en `localStorage` vía `useSyncExternalStore` (sin hydration mismatch).
- **Tooltips del riel:** en estado minimizado, **al pasar el mouse sobre el icono se muestra un `Tooltip` con el nombre de la opción** (a la derecha, `side="right"`). Usa `components/ui/tooltip.tsx` basado en **Base UI** (`@base-ui/react`), envuelto en `TooltipProvider`; Base UI **portala el tooltip al `body`**, evitando que el scroll del riel lo recorte.

**Topbar:** `bg-card/85 backdrop-blur-md`, marca **"Plataforma · Virtual"** (`· Virtual` en azul: `text-blue-800 dark:text-sky-300`). A la derecha: **píldora de usuario** (avatar de iniciales `bg-blue-950 text-amber-300` + correo, `md+`), el **campanario de notificaciones** (`NotificationBell`, solo PROFESSOR/STUDENT), el **`ThemeToggle`** deslizante, el toggle del panel de perfil (`xl+`) y "Salir" compacto (`variant="destructive"`).

## Tipografía

- Mismas **Open Sans** (cuerpo) + **Merriweather** (titulares) compartidas con la landing, pero con **jerarquía compacta** (no titulares gigantes):
  - Título de página: `text-2xl font-bold tracking-tight` (usa `font-heading` = Merriweather).
  - Subtítulo/descripción: `text-muted-foreground` (`text-sm`/`text-base`).
  - Labels y metadata: `text-sm`.
- Números (notas, montos, conteos, créditos): `tabular-nums`, alineados a la derecha en tablas.

## Layout y navegación

- **Layout de dos columnas** (`dashboard/layout.tsx`): **sidebar navy full-height a la izquierda** + **columna de contenido a la derecha** (topbar `sticky` + grid `main | panel de perfil`). La estructura, el sidebar y el topbar están descritos arriba en **"Estructura del layout del dashboard"**, **"Sidebar"** y **"Topbar"**. El topbar reemplaza al antiguo header horizontal `h-16` con nav inline.
- **Contenedor del contenido (ancho completo)**: el `<main>` **ya no centra con `max-w`**; el contenido **ocupa todo el ancho** de la columna, con solo el padding lateral del shell (`px-3 sm:px-4 lg:px-6`, `py-6`) como respiro. Las páginas usan `w-full` en su contenedor raíz (no `mx-auto max-w-*`), así tablas, libreta de calificaciones, aula y listados aprovechan el ancho. **Excepción:** formularios de una sola columna conservan un `max-w` propio pero **alineados a la izquierda** (sin `mx-auto`, para no dejar gutters centrados); los párrafos de introducción mantienen `max-w-*` solo por longitud de línea legible.
- **La nav es role-aware**: las **secciones** (agrupadas, con encabezado) salen de `navSectionsForRole(role)` en `dashboard/nav-items.ts` (fuente única de verdad), consumidas por `layout.tsx` → `DashboardSidebar`. Cada sección nueva agrega su item ahí, gateado por rol — no muestres acciones que el rol no puede ejecutar.

## Home del panel (role-aware)

La home `/dashboard` (`page.tsx`) autentica con `requireUser()` (sin gate de rol) y **ramifica por `session.user.role`**:

- **ADMIN** → tarjetas-enlace agrupadas por secciones con encabezado (`HomeSection`): **"Académico"** (Programas/cursos, Notas de estudiantes), **"Personas"** (Usuarios, Enviar aviso) y **"Gestión del sitio · Landing"** (Programas, Categorías, Aliados, Redes sociales). Cada tarjeta usa un **tinte pastel** por tono (`TINTS`: sky/violet/emerald/rose/amber) — el ámbar reservado a Usuarios/acción —, con título, descripción, conteo opcional (`tabular-nums`) y flecha que entra en hover.
- **PROFESSOR / STUDENT** → **sus cursos asignados** (`MyCoursesHome` → grid de `CourseCard`, desde `GET /me/courses`): saludo con su nombre + sección "Mis cursos". Si no tiene ninguno, estado vacío específico por rol. La nav añade **Kárdex** (solo STUDENT) y **Notificaciones** (ambos).

### Tarjeta de curso (`CourseCard`) y detalle

- **`CourseCard`** (`src/components/dashboard/course-card.tsx`): `<Link>` (estudiante → `/dashboard/mis-programas`; docente → `/dashboard/mis-cursos/[id]`). **Banda navy en degradado** (`from-blue-900 to-blue-950` / `dark:from-slate-900`) con código + **badge de estado** del curso por color (En curso `emerald` / Borrador `amber` / Concluido `sky` / Archivado), cuerpo con nombre, modalidad, nº de módulos y fecha (iconos lucide), hover de elevación. Para docentes, chips de los módulos a su cargo.
- **Detalle del curso** (`/dashboard/mis-cursos/[id]`): cabecera con la misma banda navy + meta; módulos como **acordeones `<details>` nativos** (sin JS) que muestran docentes y el **conteo de contenidos** (`contentCount`), con un acceso: estudiante → **"Entrar al aula"** (`/dashboard/aula/[moduleId]`); docente → **"Gestionar contenido"** (`/dashboard/modulos/[moduleId]`). El contenido en sí (temas/videos/materiales/actividades) ya **no** se lista aquí: vive en el aula. **El estudiante no ve módulos en borrador** (los filtra el backend).
- **Árbol de "Programas" en el sidebar** (PROFESSOR/STUDENT): la sección **🎓 PROGRAMAS** despliega un submenú por programa asignado, y cada programa despliega sus **módulos como enlaces, etiquetados "Módulo 1", "Módulo 2"…** (por `order`, con el nombre real en `title`). El nombre del programa es un enlace a su detalle (`/dashboard/mis-cursos/[id]`) y un chevron aparte abre/cierra los módulos (toggle autoritativo persistido en `localStorage`; el programa activo arranca abierto pero se puede cerrar). El enlace **"Ver todos"** del encabezado es **solo para estudiantes**. Los módulos del estudiante enlazan al aula; los del docente, a la gestión.
- **Aula / reproductor** (`/dashboard/aula/[moduleId]`, estudiante): vista de "aula" a **dos columnas**. Columna principal = panel que renderiza el contenido seleccionado **según su tipo** (`LessonVideo` con skin propio sobre YouTube/Vimeo, texto enriquecido para Tema, visor de archivo/enlace para Material, `StudentActivity` para Actividad). Columna lateral = tarjeta con pestañas **Temario** (lista de contenidos + barra de progreso + completar), **Notas** (sus calificaciones: nota por actividad + nota del módulo + observación del docente) y **Apuntes** (notas personales privadas). La selección de contenido es estado de cliente.

### Centro de notificaciones

- **Campanario** (`NotificationBell`, topbar, PROFESSOR/STUDENT): botón circular navy (`bg-blue-950`) con campana y **badge ámbar** de no leídas; popover (Base UI, ver AGENTS.md) con las 8 recientes + "Ver todas". **Bandeja** (`/dashboard/notificaciones`, estilo Gmail). **Al hacer clic en una notificación se abre en un modal** (`NotificationDetailDialog`, compartido por bandeja y campanario), **no** en una ruta de panel (no existe `/dashboard/notificaciones/[id]`); abrir = marcar leída. Icono por tipo = sobre `Mail` con **tinte distinto por tipo** (inscripción sky, asignación violet, aviso amber, calificación emerald, nueva actividad violet); el cuerpo resalta en **negrita** lo que va entre `«…»` (`NotificationBody`). Tipos/tintes en `src/lib/notifications-meta.ts`. El **admin** redacta avisos en un modal "Nuevo aviso" (`/dashboard/notificaciones/enviar`, que muestra el historial).
- **Admin → Enviar aviso** (`/dashboard/notificaciones/enviar`): formulario de audiencia (Todos / Docentes / Estudiantes / Seleccionar con multi-select buscable) + mensaje; debajo, **historial** filtrable por audiencia y texto + paginación (manejado por URL, server-side).

### Vistas académicas del docente y kárdex

- **Gestión de módulo** (`/dashboard/modulos/[moduleId]`, docente): `ModuleWorkspace` con dos pestañas:
  - **Contenido** (`ContentManager`): el temario es **una sola lista ordenable** de contenidos (no secciones separadas). Botón **"+ Agregar contenido"** → **modal** selector de tipo (Tema / Video / Material / Actividad); la **configuración de cada contenido (crear y editar) se abre en un modal** (`Dialog` Base UI), con el editor **Tiptap** para los Temas. Reordenamiento por **drag-and-drop** (`@dnd-kit`); cada contenido con badge publicado/borrador (visible por defecto), edición y borrado (`DeleteButton`).
  - **Calificaciones** (`Gradebook`): tabla **estudiantes × actividades** + columna de **nota del módulo** (calculada) + **observación** editable por estudiante (icono lápiz, guarda en `ModuleGrade.observations`, no afecta la nota calculada). Botón **"+ Nueva calificación"** (modal: nombre, puntaje máx., peso) crea una **actividad presencial** (interna `isOffline`, sin entrega del estudiante): aparece como columna donde el docente **escribe el puntaje de cada estudiante directo en la celda**; pondera en la nota igual que cualquier actividad. Cada columna así creada se puede **editar (icono lápiz → modal; solo nombre y peso, no el puntaje máximo)** o eliminar. Estas actividades **no aparecen en el temario del aula**, solo en las "Notas" del estudiante.
- **Calificación de una actividad con entrega** (`/dashboard/actividades/[activityId]`, docente): lista de estudiantes inscritos con su entrega (texto/archivo descargable), campo **nota /máximo** + retroalimentación por estudiante; guardar recalcula la nota ponderada del módulo.
- **Estado del módulo** (panel admin, `/dashboard/cursos/[id]`): cada módulo tiene un **control segmentado Activo / Concluido / Borrador** (`ModuleStatusControl`) que guarda al instante. Los módulos nuevos nacen **Activo**; un módulo en **Borrador no es visible para el estudiante** (ni en sidebar, detalle, aula o kárdex).
- **Kárdex** (`/dashboard/kardex`, solo STUDENT): por curso, tarjeta con **banda navy** (código, nombre, estado) + estadísticas (Promedio / Aprobados / Calificados en píldoras ámbar) y lista de módulos con nota + badge de estado (En curso / Aprobado / Reprobado / Sin nota). Botón **"Descargar PDF"** → `/kardex-pdf` (vista imprimible clara fuera del layout, ver AGENTS.md). La tarjeta (`KardexCourseCard`) está factorizada en `kardex/kardex-cards.tsx` para reutilizarla en el modal del admin (Notas de estudiantes). El **membrete del PDF es la imagen** `/landing/membrete.webp` (no texto).

## Sección "Usuarios" (`/dashboard/usuarios`, solo ADMIN)

Gestión de cuentas de administrativos, docentes y estudiantes (backend `/admin/users`). **Se entra a cada sección directamente desde el sidebar** (`?rol=administrativos|docentes|estudiantes`) — **no hay pestañas de filtro en la página**; el título y la etiqueta del botón ("Crear docente/estudiante") se adaptan a la sección. **Listado** = componente cliente `UsersTable` con badges semánticos sobrios (Docente `sky` / Estudiante `violet` / Activo `emerald`; **ámbar** reservado para Administrador y la acción primaria), un **buscador por nombre/apellido** (al lado del botón de crear, sin acentos/mayúsculas) y **encabezados ordenables** (asc/desc con chevrones). Cada fila tiene un **botón de WhatsApp verde** (`whatsapp-button.tsx`, abre `wa.me/591<phone>`), editar y eliminar.
**Crear/editar abren en un `Dialog`** (`user-dialogs.tsx` → `UserForm variant="dialog"`), no en páginas aparte. El formulario (`user-form.tsx` + `user-schema.ts` que espeja el DTO) pide nombre, apellido, correo, **teléfono (obligatorio)**, **documento de identidad (opcional)** y contraseña (toggle mostrar/ocultar, **mín. 6**); **no** tiene selector de Rol (el rol lo fija la sección al crear y se conserva al editar). El enlace "Volver …" y el botón Cancelar regresan a la sección de origen. **Carga masiva de estudiantes**: botón "Carga masiva" (solo sección estudiantes) → modal para **descargar plantilla `.xlsx`** y subir el archivo lleno; muestra el resumen "X de Y registrados" + filas con error. El **409** (correo duplicado) se muestra inline + banner + toast, nunca crashea.

## Sección "Notas de estudiantes" (`/dashboard/notas-estudiantes`, solo ADMIN)

Bajo el grupo **Académico** del sidebar. **Listado** = `StudentGradesTable` (cliente) con todos los STUDENT, **buscador** por nombre/correo/documento y encabezados ordenables. Cada fila tiene dos botones tintados: **"Notas"** (sky, icono `ClipboardList`) y **"Kárdex"** (violet, icono `ScrollText`). Ambos abren un **modal ancho** (`max-w-4xl`) que, arriba, muestra un **panel con los datos del estudiante** (nombre + correo · teléfono · documento) y carga los datos al abrir (React Query → route handlers `/api/admin/students/[id]/{grades,kardex}`):

- **Notas** = detalle **por actividad**: por programa → por módulo, la lista de actividades con su puntaje (`score/maxScore` + peso) y la **nota final del módulo** con badge (En curso / Aprobado / Reprobado), más la observación del docente.
- **Kárdex** = reutiliza `KardexCourseCard` (banda navy), idéntico a lo que ve el estudiante en su panel.

Cada modal cierra con un botón **"Descargar PDF" resaltado** (sólido `bg-sky-600`, no el outline sutil) que abre la vista imprimible del estudiante (`/notas-pdf/[studentId]` / `/kardex-pdf/[studentId]`, ver AGENTS.md).

## Componentes y patrones

- **Botones**: primitivos de shadcn (`Button`) — **no** el `rounded-full` de la landing. Primario con acento `bg-amber-500 text-slate-950 hover:bg-amber-400`; secundario `variant="outline"`; destructivo `variant="destructive"`; `size="sm"` en barras de acciones.
- **Tarjetas**: `rounded-xl border bg-card p-6`; tarjetas-enlace (home del panel) con `hover:border-amber-400` + flecha que aparece en hover.
- **Formularios**: shadcn `Form`/`Input`/`Label` + esquema **Zod** en `*-schema.ts` que **espeja el DTO Zod del backend**; errores inline con `aria-invalid`/`aria-describedby`; submit con estado `pending` (deshabilitado + `Loader2`). Imágenes con `src/components/admin/image-upload-field.tsx` (guarda ruta relativa `/files/...`).
- **Tablas / listas**: shadcn `Table`; jerarquía de columnas (identidad → estado como **badge** semántico → acciones al final con `dropdown-menu`); `AlertDialog` para acciones destructivas, mostrando con gracia el `409 Conflict` del backend (p. ej. borrar categoría en uso). **Tablas reordenables por drag-and-drop** (`equipo`/`categorias`/`partners`/`programas`, `*-list.tsx`): primera columna = asa `GripVertical`, reorden optimista con `@dnd-kit` sobre `<TableRow>` (ver AGENTS.md). Donde hay reorden, los formularios **no** llevan campo "orden": el orden de la tabla **es** el de la landing. En esas secciones (salvo `programas`) **crear/editar abre en `Dialog`** (`*-dialogs.tsx` → `*Form variant="dialog"`), igual que Usuarios.
- **Modales (`Dialog`)**: `src/components/ui/dialog.tsx`, basado en **Base UI** (`@base-ui/react/dialog`, **no Radix** — igual que `alert-dialog`/`tooltip`/`popover`): backdrop con blur, popup centrado `rounded-2xl`, cierre por X/Escape/backdrop. Úsalo para flujos de configuración (selector y formularios de contenido del docente, "Nueva calificación"/editar en la libreta). Para contenido alto (editor Tiptap) aplica `max-h-[85vh] overflow-y-auto` en el `DialogContent` del consumidor.
- **Texto enriquecido**: el editor de Temas es **Tiptap** (`src/components/dashboard/rich-text-editor.tsx`, emite HTML); para mostrarlo usa `RichTextContent` (`rich-text-content.tsx`) con la clase **`.richtext`** (estilos de títulos/listas/citas/enlaces definidos en `globals.css`, comparte estilos con `.tiptap`).
- **Enlaces "Volver …"**: usar **siempre** `BackLink` (`src/components/dashboard/back-link.tsx`) — píldora `rounded-full` con badge circular cuya flecha se desliza en hover (animación CSS). No improvises un `<Link>` con `<ArrowLeft/>` suelto.
- **Botón de WhatsApp**: glifo inline de simple-icons (lucide no trae marcas), **verde** (`text-green-600 dark:text-green-400`), como `Button variant="ghost" size="icon-sm"` que envuelve un `<a target="_blank">` a `wa.me/591<phone>` con `aria-label`.
- **Módulo concluido (solo lectura)**: cuando un módulo está `FINISHED`, las pantallas del docente (libreta + gestión de contenido), la calificación de actividad y el aula del estudiante **ocultan/inhabilitan** toda acción de edición y muestran un **aviso ámbar** con icono `Lock` ("Este módulo está concluido…"). Las etiquetas **Aprobado/Reprobado** del veredicto del módulo **solo** se muestran cuando está concluido; mientras está activo se ve la nota numérica con badge neutro "En curso".
- Reusar siempre primitivos de shadcn (`src/components/ui/`); añadir los que falten con `pnpm dlx shadcn@latest add <name>` (overlays se prefieren **Base UI**, ver arriba). **No** introducir otro UI kit ni el lenguaje glass-oscuro de la landing.

## Estados (matriz obligatoria)

Ninguna pantalla interna es solo "happy path". Manejar explícitamente: **cargando** (`Skeleton`), **vacío** (icono + mensaje es-BO + CTA), **error** (capturar `AdminApiError`: `404 → notFound()`, `401 →` redirección a `/api/auth/session-expired`), **conflicto 409**, **validación** inline, **pending**, **éxito** (toast). El detalle por tipo de pantalla y el checklist de calidad están en la skill **`ui-educativa`**.

## Login (`/login`) — pantalla puente

- Layout **imagen a pantalla completa + tarjeta glass centrada**: una `<Image fill>` de fondo (`/landing/image-login.webp`) cubre el viewport, con un overlay/gradiente navy tenue (`from-blue-950/25 via-blue-950/15 to-blue-950/35`) que da contraste y profundidad sin tapar la foto. El formulario va **centrado vertical y horizontalmente** (`max-w-sm`) dentro de una **tarjeta glass** translúcida navy (`rounded-2xl border border-white/20 bg-blue-950/10 backdrop-blur-lg shadow-2xl`) que deja entrever la imagen. Encima de la tarjeta, el **logo blanco** centrado (`h-14 sm:h-16`, `drop-shadow-lg`, enlazado a `/` con `aria-label` y ring de foco ámbar) — único sitio válido para el logo blanco en el área interna. Ver `src/app/login/page.tsx`.
- **Contenido en tema "sobre-imagen"** (no el tema claro de shadcn): título/labels en blanco (`text-white`, `text-white/90`), inputs translúcidos (`bg-white/10 border-white/20`, texto blanco, `placeholder:text-white/50`) con **foco ámbar** (`focus-visible:ring-amber-300/40`), checkbox "Recordarme" y botón "Ingresar" con **acento ámbar institucional** (`bg-amber-500`), y errores en rojo claro (`text-red-200`, banner `bg-red-500/15`). El **footer de copyright** va sobre la imagen, bajo la tarjeta; el texto "¿Problemas para ingresar?" vive **dentro** de la tarjeta. El par **navy + ámbar** es el estándar cromático de toda superficie oscura de la plataforma: el ámbar, al ser complementario del azul, resalta mejor sobre el navy que sobre el casi-negro `slate-950` (reservado a la landing). Ver `src/app/login/login-form.tsx`.
- **Estado "sesión expirada"** (`/login?expired=1`): banner `role="status"` ámbar ("Tu sesión expiró. Inicia sesión nuevamente para continuar."). El flujo técnico que lo origina (Route Handler `signOut` que rompe el bucle de redirección por token vencido) está en `frontend/AGENTS.md` y CLAUDE.md.
- El input de **correo es controlado** para sobrevivir al reset de `<form action>` de React 19 (re-sembrado desde la server action ante un intento fallido — ver AGENTS.md). Toggle de mostrar/ocultar contraseña con `aria-label`/`aria-pressed`. **"Recordarme"** controla la persistencia de la sesión: marcado → cookie persistente + token backend de 30 días (`JWT_REMEMBER_EXPIRES_IN`); sin marcar → cookie de sesión (se borra al cerrar el navegador) + token de 1 día. La server action `authenticate` rebaja la cookie a sesión-only cuando no se marca (ver `src/app/login/actions.ts`).

## Accesibilidad

Misma exigencia que en la landing: HTML semántico, `<label>` asociados (`useId`), foco visible (`focus-visible:ring`), `aria-*` en iconos/toggles, contraste suficiente del tema claro, y respeto de `prefers-reduced-motion`.

## Estructura de archivos

- **Panel**: `src/app/dashboard/` con `layout.tsx` (header + nav) y **una carpeta por sección** = `page.tsx` (server component, llama `requireAdmin()`) + `actions.ts` (server actions) + `*-schema.ts` + `*-form.tsx`. Lecturas vía `src/lib/api/admin.ts`; escrituras vía `mutateAdmin(...)` + `revalidatePath(...)` de cada ruta afectada. Guard: `requireAdmin()` (`src/lib/auth-guard.ts`).
- **Login**: `src/app/login/` (`page.tsx` + `login-form.tsx` + `actions.ts`) y el Route Handler `src/app/api/auth/session-expired/route.ts`.
- Convenciones completas del panel admin (split público/admin, `adminFetch`/`AdminApiError`, server actions): ver **CLAUDE.md → Frontend conventions → Admin panel**.
