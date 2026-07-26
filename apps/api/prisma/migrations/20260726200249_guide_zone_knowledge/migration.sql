-- CreateEnum
CREATE TYPE "BusinessApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "createdByUserId" TEXT;

-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "createdByUserId" TEXT;

-- AlterTable
ALTER TABLE "HowToGuide" ADD COLUMN     "createdByUserId" TEXT;

-- AlterTable
ALTER TABLE "LocalRule" ADD COLUMN     "createdByUserId" TEXT;

-- CreateTable
CREATE TABLE "BusinessApplication" (
    "id" TEXT NOT NULL,
    "proposedByGuideUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "baseCityId" TEXT NOT NULL,
    "primaryDistrictId" TEXT NOT NULL,
    "note" TEXT,
    "status" "BusinessApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdBusinessUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessApplication_status_createdAt_idx" ON "BusinessApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessApplication_proposedByGuideUserId_idx" ON "BusinessApplication"("proposedByGuideUserId");

-- AddForeignKey
ALTER TABLE "BusinessApplication" ADD CONSTRAINT "BusinessApplication_proposedByGuideUserId_fkey" FOREIGN KEY ("proposedByGuideUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessApplication" ADD CONSTRAINT "BusinessApplication_baseCityId_fkey" FOREIGN KEY ("baseCityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessApplication" ADD CONSTRAINT "BusinessApplication_primaryDistrictId_fkey" FOREIGN KEY ("primaryDistrictId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalRule" ADD CONSTRAINT "LocalRule_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HowToGuide" ADD CONSTRAINT "HowToGuide_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
