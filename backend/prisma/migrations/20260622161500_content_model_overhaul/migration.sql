-- Reinicio limpio del contenido académico (modelo unificado ModuleContent).
-- Se descartan entregas y notas previas para permitir el cambio de esquema.
DELETE FROM "submissions";
DELETE FROM "module_grades";

-- CreateEnum
CREATE TYPE "ContentKind" AS ENUM ('TEXT', 'VIDEO', 'MATERIAL', 'ACTIVITY');

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_topicId_fkey";

-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_topicId_fkey";

-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_activityId_fkey";

-- DropForeignKey
ALTER TABLE "topic_notes" DROP CONSTRAINT "topic_notes_studentId_fkey";

-- DropForeignKey
ALTER TABLE "topic_notes" DROP CONSTRAINT "topic_notes_topicId_fkey";

-- DropForeignKey
ALTER TABLE "topic_progress" DROP CONSTRAINT "topic_progress_studentId_fkey";

-- DropForeignKey
ALTER TABLE "topic_progress" DROP CONSTRAINT "topic_progress_topicId_fkey";

-- DropForeignKey
ALTER TABLE "topics" DROP CONSTRAINT "topics_moduleId_fkey";

-- DropIndex
DROP INDEX "submissions_activityId_studentId_key";

-- AlterTable
ALTER TABLE "submissions" DROP COLUMN "activityId",
DROP COLUMN "content",
ADD COLUMN     "contentId" TEXT NOT NULL,
ADD COLUMN     "text" TEXT;

-- DropTable
DROP TABLE "activities";

-- DropTable
DROP TABLE "materials";

-- DropTable
DROP TABLE "topic_notes";

-- DropTable
DROP TABLE "topic_progress";

-- DropTable
DROP TABLE "topics";

-- CreateTable
CREATE TABLE "module_contents" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "kind" "ContentKind" NOT NULL,
    "title" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "body" TEXT,
    "videoUrl" TEXT,
    "materialType" "MaterialType",
    "url" TEXT,
    "activityType" "ActivityType",
    "instructions" TEXT,
    "dueDate" TIMESTAMP(3),
    "maxScore" DECIMAL(5,2),
    "weight" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_progress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_notes" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "module_contents_moduleId_idx" ON "module_contents"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "module_contents_moduleId_order_key" ON "module_contents"("moduleId", "order");

-- CreateIndex
CREATE INDEX "content_progress_contentId_idx" ON "content_progress"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "content_progress_studentId_contentId_key" ON "content_progress"("studentId", "contentId");

-- CreateIndex
CREATE INDEX "content_notes_contentId_idx" ON "content_notes"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "content_notes_studentId_contentId_key" ON "content_notes"("studentId", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_contentId_studentId_key" ON "submissions"("contentId", "studentId");

-- AddForeignKey
ALTER TABLE "module_contents" ADD CONSTRAINT "module_contents_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_progress" ADD CONSTRAINT "content_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_progress" ADD CONSTRAINT "content_progress_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "module_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_notes" ADD CONSTRAINT "content_notes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_notes" ADD CONSTRAINT "content_notes_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "module_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "module_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

