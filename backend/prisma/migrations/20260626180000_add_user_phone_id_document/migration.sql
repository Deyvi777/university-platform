-- AlterTable: nuevos campos de contacto en usuarios.
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "idDocument" TEXT;

-- Backfill: números de teléfono inventados (móvil de Bolivia: 8 dígitos que
-- inician en 6 o 7) para los usuarios ya registrados, para poder marcar la
-- columna como NOT NULL sin romper las filas existentes.
UPDATE "users"
SET "phone" = (CASE WHEN random() < 0.5 THEN '6' ELSE '7' END)
  || lpad((floor(random() * 10000000))::int::text, 7, '0')
WHERE "phone" IS NULL;

-- Ahora el teléfono es obligatorio.
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;
