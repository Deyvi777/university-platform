-- CreateEnum
CREATE TYPE "ProgramCategory" AS ENUM ('MAESTRIA', 'DIPLOMADO');

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ProgramCategory" NOT NULL,
    "flyerUrl" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "duration" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "requirements" TEXT[],
    "enrollmentFee" DECIMAL(10,2) NOT NULL,
    "totalCost" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'Bs',
    "paymentFacilities" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_modules" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "contents" TEXT[],

    CONSTRAINT "program_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_teachers" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "photoUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "program_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "programs_slug_key" ON "programs"("slug");

-- CreateIndex
CREATE INDEX "programs_category_isPublished_idx" ON "programs"("category", "isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "program_modules_programId_order_key" ON "program_modules"("programId", "order");

-- AddForeignKey
ALTER TABLE "program_modules" ADD CONSTRAINT "program_modules_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_teachers" ADD CONSTRAINT "program_teachers_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
