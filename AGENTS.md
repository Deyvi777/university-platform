# Guía para agentes

## Contexto obligatorio

- Lee `CLAUDE.md` completo antes de modificar el proyecto. Es la referencia principal de arquitectura, contratos entre frontend y backend, comandos, convenciones y decisiones conocidas del repositorio.
- Si trabajas dentro de un directorio que contiene otro `AGENTS.md`, aplica también sus instrucciones; las más cercanas al archivo modificado complementan o especializan esta guía.
- Consulta `DATAMODEL.md` cuando el cambio afecte modelos, relaciones, calificaciones, entregas o persistencia académica.
- Conserva la interfaz y los mensajes visibles para usuarios en español, salvo que el requerimiento indique otra cosa.

## Documentación viva obligatoria

Cada cambio debe incluir una revisión de la documentación para agentes. Antes de dar una tarea por terminada:

1. Revisa el diff y decide si introdujo o cambió arquitectura, contratos, flujos, comandos, dependencias, variables de entorno, modelos de datos, rutas, permisos, convenciones o un _gotcha_ reutilizable.
2. Si lo hizo, actualiza en el mismo cambio el `AGENTS.md` de alcance más específico. Usa este archivo para reglas transversales y `frontend/AGENTS.md` para detalles exclusivos del frontend.
3. Mantén `CLAUDE.md` y los `AGENTS.md` coherentes. Si una instrucción compartida cambia, actualiza ambos documentos o conserva una única fuente canónica con una referencia explícita, como hace `frontend/CLAUDE.md` con `frontend/AGENTS.md`.
4. No documentes detalles efímeros, una implementación obvia ni una corrección puntual que no ayude en trabajos futuros. Edita o elimina reglas obsoletas en vez de acumular contradicciones.
5. En la entrega final indica si actualizaste la documentación para agentes o si el cambio no lo requería.

## Verificación

- Ejecuta las comprobaciones relevantes descritas en `CLAUDE.md` y en los `package.json` del workspace afectado.
- No consideres completa una modificación de Prisma hasta revisar las reglas de Prisma 7 y el estado especial de migraciones descritos en `CLAUDE.md`.
- Para código Next.js, sigue primero `frontend/AGENTS.md`, incluida la obligación de consultar la documentación instalada de Next.js 16.

## Contratos transversales

- Las opciones de inversión de `Program` son independientes: el pago al contado usa `totalCost` + `enrollmentFee` + `currency`, mientras el plan de cuotas usa `installmentCount` + `installmentFirstAmount` (primera cuota distinta, opcional) + `installmentAmount` (monto normal; aplica a las restantes cuando existe una primera distinta) + `installmentEnrollmentFee` + `installmentCurrency`. No compartas matrícula ni moneda entre ambos planes.

## Seguridad de producción

- **Preserva siempre todos los datos de producción.** Un despliegue no autoriza `prisma db seed`, resets, borrado o recreación de volúmenes/tablas, migraciones destructivas, `db push --accept-data-loss`, backfills destructivos ni ninguna operación que pueda eliminar o sobrescribir datos.
- Si un cambio de esquema no es demostrablemente aditivo y seguro, detén el despliegue antes de aplicarlo y solicita autorización explícita al usuario, explicando qué datos podrían verse afectados y cómo se respaldarán.
- La autorización para desplegar código no equivale a autorización para modificar o eliminar datos. Cualquier excepción requiere una autorización explícita y específica del usuario.
- Antes y después de cada despliegue comprueba el estado de los servicios y revisa los logs relevantes sin exponer secretos.
