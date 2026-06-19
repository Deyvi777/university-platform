-- CreateTable
CREATE TABLE "program_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "program_categories_slug_key" ON "program_categories"("slug");

-- Migración de datos: sembrar las categorías que existían como enum.
INSERT INTO "program_categories" ("id", "name", "slug", "displayOrder", "isActive", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid(), 'Maestría', 'maestria', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Diplomado', 'diplomado', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Columna FK (nullable durante el backfill).
ALTER TABLE "programs" ADD COLUMN "categoryId" TEXT;

-- Backfill desde el valor del enum anterior.
UPDATE "programs" SET "categoryId" = (SELECT "id" FROM "program_categories" WHERE "slug" = 'maestria') WHERE "category" = 'MAESTRIA';
UPDATE "programs" SET "categoryId" = (SELECT "id" FROM "program_categories" WHERE "slug" = 'diplomado') WHERE "category" = 'DIPLOMADO';

-- Eliminar índice, columna y tipo enum antiguos.
DROP INDEX "programs_category_isPublished_idx";
ALTER TABLE "programs" DROP COLUMN "category";
DROP TYPE "ProgramCategory";

-- Forzar NOT NULL una vez backfilleados los datos.
ALTER TABLE "programs" ALTER COLUMN "categoryId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "programs_categoryId_isPublished_idx" ON "programs"("categoryId", "isPublished");

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "program_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
