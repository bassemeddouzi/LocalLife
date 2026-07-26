-- AlterTable
ALTER TABLE "GuideProfile" ADD COLUMN     "baseCityId" TEXT,
ADD COLUMN     "primaryDistrictId" TEXT;

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "District_cityId_idx" ON "District"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "District_cityId_slug_key" ON "District"("cityId", "slug");

-- CreateIndex
CREATE INDEX "GuideProfile_baseCityId_idx" ON "GuideProfile"("baseCityId");

-- CreateIndex
CREATE INDEX "GuideProfile_primaryDistrictId_idx" ON "GuideProfile"("primaryDistrictId");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_baseCityId_fkey" FOREIGN KEY ("baseCityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_primaryDistrictId_fkey" FOREIGN KEY ("primaryDistrictId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
