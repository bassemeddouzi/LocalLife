-- AlterTable
ALTER TABLE "ClientPlan" ADD COLUMN IF NOT EXISTS "tripStartsOn" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "tripEndsOn" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dailyStartLocal" TEXT,
ADD COLUMN IF NOT EXISTS "dailyEndLocal" TEXT;

-- AlterTable
ALTER TABLE "ClientPlanStep" ADD COLUMN IF NOT EXISTS "dayIndex" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClientPlanStep_planId_dayIndex_idx" ON "ClientPlanStep"("planId", "dayIndex");
