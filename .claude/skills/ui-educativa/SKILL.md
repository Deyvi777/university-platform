---
name: ui-educativa
description: Diseño de UI/UX para plataformas educativas avanzadas y profesionales. Úsala al crear o refinar pantallas de la plataforma Certificate (dashboards académicos, gestión de cursos/módulos, kardex, formularios, tablas, paneles de admin/docente/estudiante) cuando se busque una interfaz pulida, profesional y consistente. No para la landing pública.
---

# Diseño de UI/UX para plataformas educativas avanzadas

Skill especializada en construir interfaces **profesionales, sobrias y de alta calidad** para la plataforma de postgrado **Certificate** (maestrías/diplomados, Bolivia). El objetivo es el nivel visual y de experiencia de productos educativos serios (Canvas, Coursera for Business, Notion-for-edu): densas en información pero legibles, jerárquicas, accesibles y rápidas.

Aplica a **áreas autenticadas/internas**: login, dashboard, gestión de cursos (`cursos`), módulos (`módulos`), kardex (notas/historial académico), paneles de ADMIN / PROFESSOR / STUDENT. **No** aplica a la landing pública (`src/components/landing/`, `public/landing/`) — para eso seguir `frontend/DESIGN.md` directamente.

## Paso 0 — Antes de escribir nada

1. **Lee `frontend/DESIGN.md`** (paleta, tipografía, patrones) — es la fuente de verdad visual. Esta skill la extiende, no la reemplaza.
2. **Lee los docs reales de Next 16** en `frontend/node_modules/next/dist/docs/` y `frontend/AGENTS.md` — las APIs difieren de tu entrenamiento. Middleware = `src/proxy.ts`.
3. **Audita una sección hermana ya hecha** (`src/app/dashboard/programas`, `categorias`, `partners`, `configuracion`) y copia su estructura: `page.tsx` (server) + `actions.ts` (server actions) + `*-schema.ts` (Zod) + `*-form.tsx`. No inventes una arquitectura nueva.
4. **Identifica rol y objetivo**: ¿qué rol ve la pantalla (ADMIN/PROFESSOR/STUDENT) y cuál es su tarea principal? Si es ambiguo (p. ej. kardex editable por docente vs. solo-lectura para estudiante), **pregunta antes de diseñar**.

## Principios de diseño para plataformas educativas

- **Sobrio y profesional, no juguetón.** Postgrado serio: jerarquía clara, espacio en blanco generoso, acentos de color con moderación. El ámbar (`amber-400`) es acento institucional — úsalo para la acción primaria y highlights puntuales, nunca para teñir secciones enteras.
- **Densidad con respiro.** Las pantallas académicas manejan mucha data (listas de cursos, módulos, notas). Agrupa en tarjetas/secciones con encabezados claros; usa tablas para datos tabulares y tarjetas para entidades. Evita el "muro de datos" sin jerarquía.
- **Escaneabilidad primero.** El usuario académico busca un dato puntual (una nota, una fecha, un estado de matrícula). Tipografía con jerarquía fuerte: título de sección → subtítulo/metadata → cuerpo. Alinea números a la derecha, usa tabular-nums para notas/montos.
- **Estado siempre visible.** Badges de estado (publicado/borrador, aprobado/reprobado, activo/inactivo, pendiente) con color semántico consistente. Define la semántica una vez y reúsala.
- **Consistencia > creatividad.** Cada pantalla nueva debe sentirse parte del mismo producto. Reusa espaciados, tamaños de tabla, estilos de formulario y tono de copy de las secciones existentes.

## Sistema visual (extiende DESIGN.md)

- **Stack**: Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui. Reusa primitivos de shadcn (`src/components/ui/`); añade los que falten con `pnpm dlx shadcn@latest add <name>` (table, dialog, dropdown-menu, badge, select, tabs, skeleton, sonner/toast, form, tooltip, card). **Nunca** reinventes un primitivo que shadcn ya da, ni introduzcas otro UI kit.
- **Superficies internas**: el dashboard puede usar un tema más claro/neutro que la landing oscura si así lo establece la primera pantalla del dashboard — pero decídelo **una sola vez** y sé consistente. Tarjetas glass de DESIGN.md (`border-white/10 bg-white/5 rounded-2xl`) si el tema es oscuro; superficies `bg-card border rounded-xl` si shadcn usa tema claro. Mira qué hace ya el dashboard y no mezcles.
- **Superficies de marca oscuras** (paneles/pills que alojan el **logo blanco**, p. ej. el panel de marca del login): usar **azul oscuro `bg-blue-950`** (navy institucional `#172554`), **nunca `slate-950`** (ese es el oscuro de la landing pública). El navy es el único fondo oscuro del área interna; sobre él, el acento **ámbar** (`amber-400`/`amber-300`) resalta mejor por ser complementario del azul. Mantén el par **navy + ámbar** consistente en cualquier superficie oscura de la plataforma.
- **Tipografía**: Geist Sans (ya configurada). Títulos `font-bold tracking-tight`; metadata/labels `text-sm text-muted-foreground`. Números (notas, montos, créditos) con `tabular-nums`.
- **Botones**: `rounded-full` o `rounded-lg` según el patrón shadcn vigente en el dashboard — sé consistente. Primario = acento ámbar; destructivo = variante `destructive`; secundario = outline.
- **Iconografía**: `lucide-react` para iconos de UI (no de marcas). Iconos siempre con `aria-label` cuando son la única etiqueta.
- **Copy en español (es-BO)**, natural y profesional: "módulo", "curso", "kardex", "nota", "docente", "estudiante", "matrícula", "inscripción", "malla curricular", "calificación".

## Matriz de estados obligatoria

**Nunca entregues una UI solo de happy-path.** Para cada pantalla maneja explícitamente:

- **Cargando** → skeletons (`<Skeleton>` de shadcn), no spinners genéricos en layouts complejos.
- **Vacío** → estado vacío con icono, mensaje en español orientado a la acción y CTA ("Aún no hay cursos. Crea el primero.").
- **Error** → mensaje claro; captura `AdminApiError` y muestra el mensaje del backend. `error.status === 404` → `notFound()`.
- **Conflicto (409)** → el backend lanza 409 al borrar entidades en uso (categoría/curso con dependencias). Muéstralo en un diálogo/toast amable, no como crash.
- **Validación** → errores inline por campo, en español, con `aria-invalid` y `aria-describedby`.
- **Pendiente/optimista** → submit deshabilitado + spinner mientras la server action corre.
- **Éxito** → toast/feedback confirmatorio.

## Patrones por tipo de pantalla

**Formularios** (crear/editar curso, módulo, etc.)

- shadcn `Form` + Zod en `*-schema.ts` que **espeje el DTO Zod del backend** (mismos campos/reglas). Normaliza `""` → `null` donde el backend lo espere.
- Errores inline, submit con estado pending, layout en una columna legible (`max-w-2xl`), agrupando campos relacionados.
- Imágenes (flyer, foto de docente): usa `src/components/admin/image-upload-field.tsx` → guarda ruta relativa `/files/...`. Nunca URLs absolutas del backend (`next/image` las rechaza).

**Tablas / listados** (cursos, estudiantes, entradas de kardex)

- shadcn `Table`. Jerarquía de columnas: identidad primero, estado como badge, acciones al final.
- Responsive: en móvil, scroll horizontal o colapso a tarjetas. Números/fechas alineados, `tabular-nums`.
- Filtros/búsqueda cuando la data crece; paginación para listas largas.
- Acciones de fila con `dropdown-menu`; **confirmación con `AlertDialog`** para operaciones destructivas.
- Fechas con `Intl.DateTimeFormat("es-BO", { timeZone: "UTC" })` para evitar desajustes de hidratación.

**Navegación e IA** (arquitectura de información)

- Mantén coherente `src/app/dashboard/layout.tsx`; añade el item de nav de cada sección nueva.
- Refleja el rol: ADMIN/PROFESSOR/STUDENT ven distinto. No muestres acciones que el rol no puede ejecutar.
- Flujos anidados (curso → módulo → kardex) con breadcrumbs / botón "volver".

**Vistas de datos académicos** (kardex, malla curricular, progreso)

- Kardex: agrupa notas por módulo/semestre; resumen arriba (promedio, créditos, estado), detalle abajo. Estados aprobado/reprobado con badge semántico.
- Malla curricular: módulos como tarjetas/acordeón con su estado de avance.
- Progreso: barras/indicadores sobrios, sin gamificación estridente.

## Reglas técnicas del proyecto (no romper)

- **Auth/RBAC**: el backend es la fuente de verdad. Roles `ADMIN | PROFESSOR | STUDENT`. Cada página de admin llama `requireAdmin()` (`src/lib/auth-guard.ts`).
- **Lecturas** admin → `src/lib/api/admin.ts` (`adminFetch` + `parse`, capturando `AdminApiError`). **Escrituras** → server actions en `actions.ts` que llaman `mutateAdmin(method, path, body)` y luego `revalidatePath(...)` para **cada** ruta afectada (la lista, la landing `/` si aplica, y secciones que referencian la entidad).
- **Server-first**: por defecto server components; client components solo donde haya interactividad real. Lazy-load client pesado.
- **URL → estado**: ajusta durante el render comparando el valor previo del param (patrón recomendado por React), **no** en `useEffect` (regla lint `react-hooks/set-state-in-effect`). Envuelve consumidores de `useSearchParams()` en `<Suspense>`.
- **No** toques backend, schema Prisma ni contratos de auth. Si la UI necesita un endpoint/campo inexistente, descríbelo con precisión y procede con un supuesto claro o pregunta.

## Accesibilidad (WCAG-minded)

HTML semántico; inputs con `<label>`; navegable por teclado con foco visible; contraste suficiente (DESIGN.md); ARIA solo cuando la semántica nativa no alcanza; respeta `prefers-reduced-motion` (toda animación se desactiva, ver `globals.css`). Botones de solo icono con `aria-label`.

## Checklist de autoverificación (antes de terminar)

- [ ] Sigue `DESIGN.md` y es consistente con secciones hermanas
- [ ] Copy en español (es-BO) correcto y profesional
- [ ] **Todos** los estados: cargando / vacío / error / 409 / validación / pending / éxito
- [ ] Gating de rol correcto; `requireAdmin()` respetado
- [ ] Reusa shadcn + patrones existentes; sin UI kit nuevo
- [ ] Escrituras: server action + `revalidatePath` en todas las rutas afectadas
- [ ] Sin `useEffect` para URL→estado; `useSearchParams` bajo `<Suspense>`
- [ ] Imágenes con rutas relativas `/files/...`
- [ ] Accesible (semántica, foco, contraste, aria, reduced-motion)
- [ ] Sin scope creep a la landing
- [ ] `pnpm lint` limpio

## Entregables

Cuando produzcas código, entrega archivos completos pegables o diffs precisos que **compilen y pasen lint**, usando los imports/helpers existentes. Cuando asesores sin código, da recomendaciones concretas y opinadas (layout, componentes, copy, estados) referenciando archivos/patrones específicos, no principios genéricos. Explica brevemente las decisiones de UX no obvias.

> Para tareas grandes o de varias pantallas, considera delegar al agente `UI/UX-designer` (tiene memoria de proyecto persistente); esta skill define el estándar de calidad que ese agente debe cumplir.
