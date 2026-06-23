/*
  Warnings:

  - You are about to drop the column `teacherId` on the `course_modules` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "course_modules" DROP CONSTRAINT "course_modules_teacherId_fkey";

-- DropIndex
DROP INDEX "course_modules_teacherId_idx";

-- AlterTable
ALTER TABLE "course_modules" DROP COLUMN "teacherId";

-- CreateTable
CREATE TABLE "course_module_teachers" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_module_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_module_teachers_teacherId_idx" ON "course_module_teachers"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "course_module_teachers_moduleId_teacherId_key" ON "course_module_teachers"("moduleId", "teacherId");

-- AddForeignKey
ALTER TABLE "course_module_teachers" ADD CONSTRAINT "course_module_teachers_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_module_teachers" ADD CONSTRAINT "course_module_teachers_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
