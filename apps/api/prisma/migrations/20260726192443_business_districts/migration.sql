-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "baseCityId" TEXT,
ADD COLUMN     "primaryDistrictId" TEXT;

-- CreateIndex
CREATE INDEX "BusinessProfile_baseCityId_idx" ON "BusinessProfile"("baseCityId");

-- CreateIndex
CREATE INDEX "BusinessProfile_primaryDistrictId_idx" ON "BusinessProfile"("primaryDistrictId");

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_baseCityId_fkey" FOREIGN KEY ("baseCityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_primaryDistrictId_fkey" FOREIGN KEY ("primaryDistrictId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
