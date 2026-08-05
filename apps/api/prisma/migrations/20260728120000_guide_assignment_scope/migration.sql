-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "GuideAssignmentLevel" AS ENUM ('HOOD', 'DISTRICT', 'CITY', 'STATE', 'COUNTRY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable Hood
CREATE TABLE IF NOT EXISTS "Hood" (
  "id" TEXT NOT NULL,
  "districtId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "latitude" DECIMAL(10,7) NOT NULL,
  "longitude" DECIMAL(10,7) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Hood_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Hood_districtId_slug_key" ON "Hood"("districtId", "slug");
CREATE INDEX IF NOT EXISTS "Hood_districtId_idx" ON "Hood"("districtId");

DO $$ BEGIN
  ALTER TABLE "Hood" ADD CONSTRAINT "Hood_districtId_fkey"
    FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable GuideProfile
ALTER TABLE "GuideProfile" ADD COLUMN IF NOT EXISTS "assignmentLevel" "GuideAssignmentLevel" NOT NULL DEFAULT 'DISTRICT';
ALTER TABLE "GuideProfile" ADD COLUMN IF NOT EXISTS "countryId" TEXT;
ALTER TABLE "GuideProfile" ADD COLUMN IF NOT EXISTS "regionId" TEXT;
ALTER TABLE "GuideProfile" ADD COLUMN IF NOT EXISTS "hoodId" TEXT;

CREATE INDEX IF NOT EXISTS "GuideProfile_hoodId_idx" ON "GuideProfile"("hoodId");
CREATE INDEX IF NOT EXISTS "GuideProfile_regionId_idx" ON "GuideProfile"("regionId");
CREATE INDEX IF NOT EXISTS "GuideProfile_countryId_idx" ON "GuideProfile"("countryId");
CREATE INDEX IF NOT EXISTS "GuideProfile_assignmentLevel_idx" ON "GuideProfile"("assignmentLevel");

DO $$ BEGIN
  ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_countryId_fkey"
    FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_regionId_fkey"
    FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_hoodId_fkey"
    FOREIGN KEY ("hoodId") REFERENCES "Hood"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
