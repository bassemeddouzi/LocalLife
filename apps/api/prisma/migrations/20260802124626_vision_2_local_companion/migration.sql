-- CreateEnum
CREATE TYPE "ConservatismLevel" AS ENUM ('OPEN', 'MODERATE', 'CONSERVATIVE', 'STRICT');

-- CreateEnum
CREATE TYPE "ClientVibe" AS ENUM ('ADVENTURE', 'CLASSY', 'CALM');

-- CreateEnum
CREATE TYPE "PlaceSettingPref" AS ENUM ('COUNTRYSIDE', 'CITY', 'MIDDLE');

-- CreateEnum
CREATE TYPE "GroupSizePref" AS ENUM ('SOLO', 'COUPLE', 'FRIENDS', 'FAMILY_KIDS');

-- CreateEnum
CREATE TYPE "EffortLevel" AS ENUM ('EASY', 'MODERATE', 'HARD');

-- CreateEnum
CREATE TYPE "AccessDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ZoneCharacter" AS ENUM ('INDUSTRIAL', 'TOURIST', 'RESIDENTIAL', 'MIXED');

-- CreateEnum
CREATE TYPE "SafetyLevel" AS ENUM ('VERY_DANGER', 'DANGER', 'MEDIUM', 'GOOD', 'VERY_GOOD');

-- CreateEnum
CREATE TYPE "TimeContext" AS ENUM ('DAY', 'NIGHT', 'WEEKEND', 'ANY');

-- CreateEnum
CREATE TYPE "AudienceTag" AS ENUM ('COUPLE', 'FAMILY_CONSERVATIVE', 'FRIENDS', 'SOLO', 'BOYS', 'GIRLS', 'KIDS', 'ADULT_NIGHTLIFE', 'WORKERS', 'STUDENTS', 'ALL');

-- CreateEnum
CREATE TYPE "SubGuideApplicationStatus" AS ENUM ('DRAFT', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ClientPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ClientPlanSource" AS ENUM ('CHAT', 'PACK', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReportReasonCode" AS ENUM ('INACCURATE', 'CLOSED', 'SAFETY_CONCERN', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PersonaType" ADD VALUE 'WORKER';
ALTER TYPE "PersonaType" ADD VALUE 'VISITING';
ALTER TYPE "PersonaType" ADD VALUE 'TREATMENT';
ALTER TYPE "PersonaType" ADD VALUE 'COUPLE';
ALTER TYPE "PersonaType" ADD VALUE 'FAMILY';
ALTER TYPE "PersonaType" ADD VALUE 'SOLO';
ALTER TYPE "PersonaType" ADD VALUE 'ADVENTURE';

-- AlterTable
ALTER TABLE "GuideProfile" ADD COLUMN     "borderGeoJson" JSONB,
ADD COLUMN     "lastContentReviewAt" TIMESTAMP(3),
ADD COLUMN     "parentGuideId" TEXT;

-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "accessDifficulty" "AccessDifficulty",
ADD COLUMN     "ambienceTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "audienceTags" "AudienceTag"[] DEFAULT ARRAY[]::"AudienceTag"[],
ADD COLUMN     "bestArriveText" TEXT,
ADD COLUMN     "bestLeaveText" TEXT,
ADD COLUMN     "budgetBand" "BudgetBand",
ADD COLUMN     "checklistJson" JSONB,
ADD COLUMN     "effortLevel" "EffortLevel",
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "freshnessScore" DECIMAL(5,2),
ADD COLUMN     "guideComment" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "paidEntry" BOOLEAN,
ADD COLUMN     "precautionsText" TEXT,
ADD COLUMN     "prerequisitesText" TEXT,
ADD COLUMN     "seasonNote" TEXT,
ADD COLUMN     "ticketHowTo" TEXT,
ADD COLUMN     "ticketPriceText" TEXT,
ADD COLUMN     "ticketUrl" TEXT,
ADD COLUMN     "typicalDurationMin" INTEGER;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "assignedGuideUserId" TEXT,
ADD COLUMN     "reasonCode" "ReportReasonCode" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN     "conservatismLevel" "ConservatismLevel" NOT NULL DEFAULT 'MODERATE',
ADD COLUMN     "groupSize" "GroupSizePref" NOT NULL DEFAULT 'SOLO',
ADD COLUMN     "hardFiltersJson" JSONB,
ADD COLUMN     "hasVehicle" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "settingPref" "PlaceSettingPref",
ADD COLUMN     "vibe" "ClientVibe",
ADD COLUMN     "walksOk" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AvatarCue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "animationHint" TEXT NOT NULL DEFAULT 'wave',
    "deepLink" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "notificationId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvatarCue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubGuideApplication" (
    "id" TEXT NOT NULL,
    "mainGuideUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "formationNote" TEXT,
    "borderGeoJson" JSONB NOT NULL,
    "status" "SubGuideApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdUserId" TEXT,
    "adminReviewedAt" TIMESTAMP(3),
    "adminReviewerId" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubGuideApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoneSafetyAssessment" (
    "id" TEXT NOT NULL,
    "cityId" TEXT,
    "districtId" TEXT,
    "hoodId" TEXT,
    "timeContext" "TimeContext" NOT NULL,
    "safetyLevel" "SafetyLevel" NOT NULL,
    "reason" TEXT NOT NULL,
    "guideComment" TEXT,
    "zoneCharacter" "ZoneCharacter",
    "howToArrive" TEXT,
    "createdByUserId" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "lastReviewedAt" TIMESTAMP(3),
    "freshnessScore" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoneSafetyAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cityId" TEXT,
    "title" TEXT NOT NULL,
    "status" "ClientPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "ClientPlanSource" NOT NULL DEFAULT 'MANUAL',
    "offlinePayloadJson" JSONB,
    "planPackId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPlanStep" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3),
    "placeId" TEXT,
    "eventId" TEXT,
    "freeText" TEXT,
    "durationMin" INTEGER,
    "transportNote" TEXT,
    "whyJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPlanStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanPack" (
    "id" TEXT NOT NULL,
    "cityId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "personaHints" "PersonaType"[] DEFAULT ARRAY[]::"PersonaType"[],
    "stepsJson" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportScenario" (
    "id" TEXT NOT NULL,
    "cityId" TEXT,
    "fromLabel" TEXT NOT NULL,
    "toLabel" TEXT NOT NULL,
    "stepsJson" JSONB NOT NULL,
    "estCostMin" DECIMAL(12,2),
    "estCostMax" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "estMinutes" INTEGER,
    "pricingModes" "PricingType"[] DEFAULT ARRAY[]::"PricingType"[],
    "guideComment" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "lastReviewedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportScenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvatarCue_userId_createdAt_idx" ON "AvatarCue"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SubGuideApplication_mainGuideUserId_status_idx" ON "SubGuideApplication"("mainGuideUserId", "status");

-- CreateIndex
CREATE INDEX "SubGuideApplication_status_idx" ON "SubGuideApplication"("status");

-- CreateIndex
CREATE INDEX "ZoneSafetyAssessment_cityId_timeContext_idx" ON "ZoneSafetyAssessment"("cityId", "timeContext");

-- CreateIndex
CREATE INDEX "ZoneSafetyAssessment_districtId_timeContext_idx" ON "ZoneSafetyAssessment"("districtId", "timeContext");

-- CreateIndex
CREATE INDEX "ClientPlan_userId_status_idx" ON "ClientPlan"("userId", "status");

-- CreateIndex
CREATE INDEX "ClientPlanStep_planId_sortOrder_idx" ON "ClientPlanStep"("planId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PlanPack_code_key" ON "PlanPack"("code");

-- CreateIndex
CREATE INDEX "TransportScenario_cityId_idx" ON "TransportScenario"("cityId");

-- CreateIndex
CREATE INDEX "GuideProfile_parentGuideId_idx" ON "GuideProfile"("parentGuideId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_parentGuideId_fkey" FOREIGN KEY ("parentGuideId") REFERENCES "GuideProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarCue" ADD CONSTRAINT "AvatarCue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubGuideApplication" ADD CONSTRAINT "SubGuideApplication_mainGuideUserId_fkey" FOREIGN KEY ("mainGuideUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneSafetyAssessment" ADD CONSTRAINT "ZoneSafetyAssessment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPlan" ADD CONSTRAINT "ClientPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPlan" ADD CONSTRAINT "ClientPlan_planPackId_fkey" FOREIGN KEY ("planPackId") REFERENCES "PlanPack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPlanStep" ADD CONSTRAINT "ClientPlanStep_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ClientPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
