-- AlterTable Event: prerequisites for "what to do before"
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "prerequisites" TEXT;

-- AlterTable BusinessApplication: location + media fields for Guide proposals
ALTER TABLE "BusinessApplication" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "BusinessApplication" ADD COLUMN IF NOT EXISTS "addressText" TEXT;
ALTER TABLE "BusinessApplication" ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(9,6);
ALTER TABLE "BusinessApplication" ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(9,6);
ALTER TABLE "BusinessApplication" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE "BusinessApplication" ADD COLUMN IF NOT EXISTS "categoryKey" TEXT;
