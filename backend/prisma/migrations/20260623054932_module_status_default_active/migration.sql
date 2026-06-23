-- AlterTable
ALTER TABLE "course_modules" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- Backfill: los módulos existentes en borrador pasan a activos.
UPDATE "course_modules" SET "status" = 'ACTIVE' WHERE "status" = 'DRAFT';
